import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getIpHash(): Promise<string> {
    const headersList = await headers();
    const ip = headersList.get("cf-connecting-ip") ||
        headersList.get("x-forwarded-for") ||
        "127.0.0.1";

    // Simple hashing for privacy/identifier consistency
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + process.env.AUTH_SECRET); // Salt with auth secret
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkGuestLimit(ipHash: string): Promise<{ allowed: boolean; remaining: number }> {
    let db: any;
    try {
        const ctx = getCloudflareContext();
        db = ctx.env.DB;
    } catch (e) {
        console.warn("No Cloudflare context, using mock DB or skipping limit check");
        return { allowed: true, remaining: 5 }; // Fallback for local dev without D1 binding
    }

    if (!db) {
        return { allowed: true, remaining: 999 };
    }

    // Check existing session
    const session = await db.prepare("SELECT * FROM guest_sessions WHERE ipHash = ?").bind(ipHash).first();

    if (!session) {
        // Create new session
        await db.prepare("INSERT INTO guest_sessions (ipHash, creditsRemaining) VALUES (?, 5)").bind(ipHash).run();
        return { allowed: true, remaining: 5 };
    }

    if (session.creditsRemaining > 0) {
        return { allowed: true, remaining: session.creditsRemaining };
    }

    return { allowed: false, remaining: 0 };
}

export async function decrementGuestCredit(ipHash: string) {
    let db: any;
    try {
        const ctx = getCloudflareContext();
        db = ctx.env.DB;
    } catch (e) {
        return;
    }

    if (!db) return;

    await db.prepare("UPDATE guest_sessions SET creditsRemaining = creditsRemaining - 1, lastActive = CURRENT_TIMESTAMP WHERE ipHash = ? AND creditsRemaining > 0").bind(ipHash).run();
}
