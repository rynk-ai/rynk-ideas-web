import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getIpHash } from "@/lib/ip-limit";

// POST /api/auth/claim — Convert guest data to user data
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const ipHash = await getIpHash();
        const db = getCloudflareContext().env.DB;

        // 1. Update Dumps
        const guestUserId = `guest:${ipHash}`;

        // 1. Update Dumps
        const dumpsResult = await db.prepare(`
            UPDATE dumps 
            SET userId = ? 
            WHERE userId = ? OR (ipHash = ? AND userId LIKE 'guest:%')
        `).bind(userId, guestUserId, ipHash).run();

        // 2. Update Threads
        const threadsResult = await db.prepare(`
            UPDATE idea_threads 
            SET userId = ? 
            WHERE userId = ? OR (ipHash = ? AND userId LIKE 'guest:%')
        `).bind(userId, guestUserId, ipHash).run();

        // 3. Optional: Clear guest session credits (or leave them as history)
        // We'll reset credits so they don't get blocked if they log out? 
        // Or keep them consumed? Let's delete the session to "reset" guest state for this IP if they log out.
        // Actually, if many users share IP (nat), deleting might affect others if collisions? 
        // But hash includes salt, so it's consistent.
        // Let's just leave it.

        return NextResponse.json({
            success: true,
            claimedDumps: dumpsResult.meta.changes,
            claimedThreads: threadsResult.meta.changes
        });

    } catch (error) {
        console.error("Failed to claim guest data:", error);
        return NextResponse.json({ error: "Failed to claim data" }, { status: 500 });
    }
}
