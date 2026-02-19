import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { getIpHash, checkGuestLimit, decrementGuestCredit } from "@/lib/ip-limit";

// POST /api/dumps — Create a new dump
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        let userId = session?.user?.id;
        let ipHash: string | null = null;
        let isGuest = false;

        const db = getCloudflareContext().env.DB;

        if (!userId) {
            // Guest Flow
            isGuest = true;
            ipHash = await getIpHash();
            const { allowed, remaining } = await checkGuestLimit(ipHash);

            if (!allowed) {
                return NextResponse.json(
                    { error: "Guest limit reached. Sign in to continue." },
                    { status: 403 }
                );
            }

            userId = `guest:${ipHash}`; // Placeholder userId for guests
        } else {
            // Authenticated Flow - Check Subscription Limits
            // 1. Get user's subscription tier
            const user = await db.prepare("SELECT subscriptionTier FROM users WHERE id = ?").bind(userId).first();
            const tier = (user?.subscriptionTier as string) || "free";

            // 2. If free tier, check usage
            if (tier === "free") {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                const usageResult = await db.prepare(`
                    SELECT COUNT(*) as count
                    FROM dumps
                    WHERE userId = ? AND createdAt >= ?
                `).bind(userId, startOfMonth).first();

                const dumpCount = (usageResult?.count as number) || 0;

                if (dumpCount >= 50) {
                    return NextResponse.json(
                        { error: "Monthly limit reached. Please upgrade to Pro for unlimited dumps." },
                        { status: 403 }
                    );
                }
            }
        }

        const { content, contentType = "text", mediaUrls } = await req.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const id = generateId();

        await db
            .prepare(
                `INSERT INTO dumps (id, userId, ipHash, content, contentType, mediaUrls, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
            )
            .bind(id, userId, ipHash, content.trim(), contentType, mediaUrls ? JSON.stringify(mediaUrls) : null)
            .run();

        // Decrement guest credits if applicable
        if (isGuest && ipHash) {
            await decrementGuestCredit(ipHash);
        }

        return NextResponse.json({ id, success: true });
    } catch (error) {
        console.error("Failed to create dump:", error);
        return NextResponse.json({ error: "Failed to save dump" }, { status: 500 });
    }
}

// GET /api/dumps — List recent dumps
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
        const limit = parseInt(url.searchParams.get("limit") || "50");

        // Fetch by userId (which covers both auth users and guests with placeholder IDs)
        // For guests, strictly speaking we could query by `ipHash` too, but `userId` convention works.
        // Actually, let's query by `userId` OR `ipHash` to be robust if we switch conventions, 
        // but for now `userId` is consistent.

        const { results } = await db
            .prepare(
                `SELECT id, content, contentType, mediaUrls, createdAt, updatedAt
         FROM dumps
         WHERE userId = ?
         ORDER BY createdAt DESC
         LIMIT ?`
            )
            .bind(userId, limit)
            .all();

        return NextResponse.json({ dumps: results });
    } catch (error) {
        console.error("Failed to fetch dumps:", error);
        return NextResponse.json({ error: "Failed to fetch dumps" }, { status: 500 });
    }
}
