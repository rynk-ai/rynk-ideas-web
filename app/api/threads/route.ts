import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getIpHash } from "@/lib/ip-limit";

// GET /api/threads — List all idea threads (for board view)
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        let userId = session?.user?.id;
        let ipHash: string | null = null;

        if (!userId) {
            ipHash = await getIpHash();
            userId = `guest:${ipHash}`;
        }

        const db = getCloudflareContext().env.DB;
        const url = new URL(req.url);
        const state = url.searchParams.get("state"); // optional filter

        // Query by userId OR ipHash (for guests who might have data linked via either)
        let query = `
      SELECT id, title, summary, state, stateReason, realityScore, 
             groundingNote, momentum, segmentCount, lastActivityAt, createdAt
      FROM idea_threads
      WHERE (userId = ? OR ipHash = ?)
    `;
        // If not guest, ipHash is null, so it won't match anything extra (or matches null if column allows, but minimal risk)
        // Actually to be safe:
        const params: any[] = [userId, ipHash || ""];

        if (state) {
            query += ` AND state = ?`;
            params.push(state);
        }

        query += ` ORDER BY lastActivityAt DESC`;

        const { results } = await db.prepare(query).bind(...params).all();

        // Group threads by state for board view
        const board: Record<string, any[]> = {};
        for (const thread of results as any[]) {
            const s = thread.state || "seed";
            if (!board[s]) board[s] = [];
            board[s].push(thread);
        }

        return NextResponse.json({ threads: results, board });
    } catch (error) {
        console.error("Failed to fetch threads:", error);
        return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
    }
}
