import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// POST /api/dumps — Create a new dump
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, contentType = "text", mediaUrls } = await req.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const db = getCloudflareContext().env.DB;
        const userId = session.user.id;

        // --- Usage Limit Enforcement ---
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
        // -------------------------------

        const id = generateId();

        await db
            .prepare(
                `INSERT INTO dumps (id, userId, content, contentType, mediaUrls, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
            )
            .bind(id, userId, content.trim(), contentType, mediaUrls ? JSON.stringify(mediaUrls) : null)
            .run();

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
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getCloudflareContext().env.DB;
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "50");

        const { results } = await db
            .prepare(
                `SELECT id, content, contentType, mediaUrls, createdAt, updatedAt
         FROM dumps
         WHERE userId = ?
         ORDER BY createdAt DESC
         LIMIT ?`
            )
            .bind(session.user.id, limit)
            .all();

        return NextResponse.json({ dumps: results });
    } catch (error) {
        console.error("Failed to fetch dumps:", error);
        return NextResponse.json({ error: "Failed to fetch dumps" }, { status: 500 });
    }
}
