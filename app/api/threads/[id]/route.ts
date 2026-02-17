import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

// GET /api/threads/[id] — Get thread detail with segments and edges
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = getCloudflareContext().env.DB;

        // Get thread
        const thread = await db
            .prepare(
                `SELECT * FROM idea_threads WHERE id = ?`
            )
            .bind(id)
            .first();

        if (!thread) {
            return NextResponse.json({ error: "Thread not found" }, { status: 404 });
        }

        // Get all segments for this thread (with their dump content for timeline)
        const { results: segments } = await db
            .prepare(
                `SELECT s.id, s.content, s.segmentType, s.confidence, s.createdAt,
                d.content as dumpContent, d.createdAt as dumpCreatedAt
         FROM segments s
         JOIN dumps d ON s.dumpId = d.id
         WHERE s.threadId = ?
         ORDER BY d.createdAt ASC`
            )
            .bind(id)
            .all();

        // Get edges (connections to other threads)
        const { results: edges } = await db
            .prepare(
                `SELECT te.*, 
                CASE 
                  WHEN te.fromThreadId = ? THEN t2.title 
                  ELSE t1.title 
                END as connectedTitle,
                CASE 
                  WHEN te.fromThreadId = ? THEN te.toThreadId 
                  ELSE te.fromThreadId 
                END as connectedThreadId
         FROM thread_edges te
         LEFT JOIN idea_threads t1 ON te.fromThreadId = t1.id
         LEFT JOIN idea_threads t2 ON te.toThreadId = t2.id
         WHERE te.fromThreadId = ? OR te.toThreadId = ?`
            )
            .bind(id, id, id, id)
            .all();

        return NextResponse.json({ thread, segments, edges });
    } catch (error) {
        console.error("Failed to fetch thread:", error);
        return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
    }
}
