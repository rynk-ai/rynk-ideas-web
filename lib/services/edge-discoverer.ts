/**
 * Edge Discoverer Service
 * 
 * After synthesis, discovers relationships between threads by comparing
 * a thread's summary embedding against segments in other threads.
 * Creates thread_edges rows for strong matches.
 */

import { embedSegment } from "./embedder";
import { generateId } from "@/lib/utils";

const EDGE_SIMILARITY_THRESHOLD = 0.6;
const MAX_EDGES_PER_THREAD = 5;

interface DiscoveredEdge {
    toThreadId: string;
    strength: number;
    reason: string;
}

/**
 * Discover edges from a thread to other threads.
 * 
 * Strategy:
 * 1. Embed the thread's title + summary as a query vector
 * 2. Search Vectorize for similar segments across all threads
 * 3. Group matches by threadId, averaging similarity
 * 4. Filter to other threads above threshold
 * 5. Upsert thread_edges (avoid duplicates)
 */
export async function discoverEdges(
    ai: any,
    vectorize: any,
    db: any,
    threadId: string,
    userId: string,
    title: string,
    summary: string
): Promise<DiscoveredEdge[]> {
    try {
        // 1. Create query embedding from thread title + summary
        const queryText = `${title}. ${summary || ""}`.trim();
        if (queryText.length < 10) return [];

        const queryVector = await embedSegment(ai, queryText);

        // 2. Search Vectorize for similar segments
        const results = await vectorize.query(queryVector, {
            topK: 20,
            filter: {
                userId,
                product: "rynk-ideas",
            },
            returnMetadata: "all",
        });

        const matches = results.matches || [];

        // 3. Group by threadId and calculate average similarity
        const threadScores: Record<string, { totalScore: number; count: number; texts: string[] }> = {};

        for (const match of matches) {
            const matchThreadId = match.metadata?.threadId;
            if (!matchThreadId || matchThreadId === threadId) continue; // skip self
            if (match.score < EDGE_SIMILARITY_THRESHOLD) continue;

            if (!threadScores[matchThreadId]) {
                threadScores[matchThreadId] = { totalScore: 0, count: 0, texts: [] };
            }
            threadScores[matchThreadId].totalScore += match.score;
            threadScores[matchThreadId].count += 1;
            if (match.metadata?.text) {
                threadScores[matchThreadId].texts.push(match.metadata.text);
            }
        }

        // 4. Rank and filter
        const candidates = Object.entries(threadScores)
            .map(([toThreadId, data]) => ({
                toThreadId,
                strength: data.totalScore / data.count,
                matchCount: data.count,
                sampleText: data.texts[0] || "",
            }))
            .filter(c => c.strength >= EDGE_SIMILARITY_THRESHOLD)
            .sort((a, b) => b.strength - a.strength)
            .slice(0, MAX_EDGES_PER_THREAD);

        if (candidates.length === 0) return [];

        // 5. Fetch connected thread titles for reason generation
        const connectedIds = candidates.map(c => c.toThreadId);
        const placeholders = connectedIds.map(() => "?").join(",");
        const { results: connectedThreads } = await db
            .prepare(
                `SELECT id, title FROM idea_threads WHERE id IN (${placeholders})`
            )
            .bind(...connectedIds)
            .all() as any;

        const titleMap: Record<string, string> = {};
        for (const t of connectedThreads || []) {
            titleMap[t.id] = t.title;
        }

        // 6. Upsert edges (delete old edges from this thread, insert new)
        await db
            .prepare(`DELETE FROM thread_edges WHERE fromThreadId = ?`)
            .bind(threadId)
            .run();

        const edges: DiscoveredEdge[] = [];

        for (const candidate of candidates) {
            const connectedTitle = titleMap[candidate.toThreadId] || "Unknown";
            const reason = `Shares thematic overlap with "${connectedTitle}" (${candidate.matchCount} matching segments)`;

            await db
                .prepare(
                    `INSERT INTO thread_edges (id, fromThreadId, toThreadId, edgeType, strength, reason, createdAt)
                     VALUES (?, ?, ?, 'relates_to', ?, ?, datetime('now'))`
                )
                .bind(
                    generateId(),
                    threadId,
                    candidate.toThreadId,
                    candidate.strength,
                    reason
                )
                .run();

            edges.push({
                toThreadId: candidate.toThreadId,
                strength: candidate.strength,
                reason,
            });
        }

        console.log(`[EdgeDiscoverer] Found ${edges.length} edges for thread ${threadId}`);
        return edges;
    } catch (error) {
        console.error("[EdgeDiscoverer] Failed:", error);
        return []; // Non-fatal — don't break the pipeline
    }
}
