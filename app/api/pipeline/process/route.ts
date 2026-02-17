import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/utils";
import { segmentDump, type ThreadContext } from "@/lib/services/segmenter";
import { embedSegment, storeEmbedding } from "@/lib/services/embedder";
import { clusterSegment } from "@/lib/services/clusterer";
import { synthesizeThread, type TemporalContext } from "@/lib/services/synthesizer";
import { discoverEdges } from "@/lib/services/edge-discoverer";

/**
 * POST /api/pipeline/process
 * 
 * Orchestrates the full context-aware pipeline:
 * 1. Fetch dump + existing threads (context)
 * 2. Segment with thread awareness
 * 3. Embed + cluster (with thread hints)
 * 4. Synthesize with temporal context
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { dumpId } = await req.json();

        if (!dumpId) {
            return NextResponse.json({ error: "dumpId is required" }, { status: 400 });
        }

        const { env } = getCloudflareContext();
        const db = env.DB;
        const ai = env.AI;
        const vectorize = env.VECTORIZE_INDEX;
        const userId = session.user.id;

        // 1. Fetch the dump
        const dump = await db
            .prepare(`SELECT * FROM dumps WHERE id = ? AND userId = ?`)
            .bind(dumpId, userId)
            .first() as any;

        if (!dump) {
            return NextResponse.json({ error: "Dump not found" }, { status: 404 });
        }

        // 2. Fetch existing threads for context-aware segmentation
        const { results: existingThreads } = await db
            .prepare(
                `SELECT id, title, summary, state, segmentCount
         FROM idea_threads
         WHERE userId = ?
         ORDER BY lastActivityAt DESC
         LIMIT 20`
            )
            .bind(userId)
            .all() as any;

        const threadContext: ThreadContext[] = (existingThreads || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            summary: t.summary,
            state: t.state,
            segmentCount: t.segmentCount,
        }));

        // 3. Segment the dump with thread awareness
        const segments = await segmentDump(ai, dump.content, threadContext);

        // 4. For each segment: insert → embed → cluster (with hint)
        const results = [];
        const affectedThreadIds = new Set<string>();

        for (const seg of segments) {
            // Insert segment into DB
            const segmentId = generateId();
            await db
                .prepare(
                    `INSERT INTO segments (id, dumpId, userId, content, segmentType, createdAt)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`
                )
                .bind(segmentId, dumpId, userId, seg.text, seg.type)
                .run();

            // Generate embedding
            const vector = await embedSegment(ai, seg.text);

            // Cluster: use thread hint from segmenter if available
            const clusterResult = await clusterSegment(
                db, vectorize, segmentId, vector, userId, seg.text,
                seg.existingThreadHint  // pass the hint
            );

            // Store embedding with thread metadata
            await storeEmbedding(vectorize, segmentId, vector, {
                userId,
                threadId: clusterResult.threadId,
                segmentType: seg.type,
                text: seg.text,
            });

            // Mark segment as embedded
            await db
                .prepare(`UPDATE segments SET embeddingStored = 1 WHERE id = ?`)
                .bind(segmentId)
                .run();

            affectedThreadIds.add(clusterResult.threadId);
            results.push({ segmentId, ...clusterResult, text: seg.text });
        }

        // 5. Re-synthesize affected threads with temporal context
        for (const threadId of affectedThreadIds) {
            // Fetch all segments for this thread
            const { results: threadSegments } = await db
                .prepare(
                    `SELECT s.content as text, s.segmentType as type, s.createdAt
           FROM segments s
           WHERE s.threadId = ?
           ORDER BY s.createdAt ASC`
                )
                .bind(threadId)
                .all() as any;

            if (!threadSegments || threadSegments.length === 0) continue;

            // Compute temporal context from dumps that contributed to this thread
            const temporal = await computeTemporalContext(db, threadId);

            // Synthesize with full context
            const synthesis = await synthesizeThread(ai, threadSegments, temporal);

            // Store everything including grounding note + momentum
            await db
                .prepare(
                    `UPDATE idea_threads 
           SET title = ?, summary = ?, state = ?, stateReason = ?,
               realityScore = ?, groundingNote = ?, momentum = ?,
               updatedAt = datetime('now')
           WHERE id = ?`
                )
                .bind(
                    synthesis.title,
                    synthesis.summary,
                    synthesis.state,
                    synthesis.stateReason,
                    synthesis.realityScore,
                    synthesis.groundingNote,
                    synthesis.momentum,
                    threadId
                )
                .run();

            // 5. Discover edges to other threads
            await discoverEdges(
                ai, vectorize, db,
                threadId, userId,
                synthesis.title, synthesis.summary
            );
        }

        return NextResponse.json({
            success: true,
            segmentsProcessed: segments.length,
            threadsAffected: affectedThreadIds.size,
            results,
        });
    } catch (error) {
        console.error("Pipeline processing failed:", error);
        return NextResponse.json(
            { error: "Pipeline processing failed", details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * Compute temporal context for a thread:
 * - How many dumps mention it, first/last mention dates
 * - Recent vs older activity for momentum detection
 */
async function computeTemporalContext(
    db: any,
    threadId: string
): Promise<TemporalContext> {
    // Get dump dates for segments in this thread
    const { results: dumpDates } = await db
        .prepare(
            `SELECT DISTINCT d.createdAt
       FROM segments s
       JOIN dumps d ON s.dumpId = d.id
       WHERE s.threadId = ?
       ORDER BY d.createdAt ASC`
        )
        .bind(threadId)
        .all() as any;

    const dates = (dumpDates || []).map((r: any) => new Date(r.createdAt));

    if (dates.length === 0) {
        return {
            totalDumps: 0,
            firstMentioned: new Date().toISOString(),
            lastMentioned: new Date().toISOString(),
            daysSinceLastMention: 0,
            recentDumpCount: 0,
            olderDumpCount: 0,
        };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastDate = dates[dates.length - 1];
    const daysSince = Math.floor(
        (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const recentDumpCount = dates.filter((d: Date) => d >= sevenDaysAgo).length;
    const olderDumpCount = dates.filter((d: Date) => d < sevenDaysAgo).length;

    return {
        totalDumps: dates.length,
        firstMentioned: dates[0].toISOString(),
        lastMentioned: lastDate.toISOString(),
        daysSinceLastMention: daysSince,
        recentDumpCount,
        olderDumpCount,
    };
}
