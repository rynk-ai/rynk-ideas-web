import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { SubscriptionStatus } from '@/types/subscription'

// Get D1 database binding
const getDB = () => {
    return getCloudflareContext().env.DB
}

export async function GET() {
    try {
        // Authenticate user
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const db = getDB()
        const userId = session.user.id

        // Fetch subscription info from database (including ideas-specific fields)
        const user = await db.prepare(`
      SELECT 
        subscriptionTier,
        subscriptionStatus,
        credits,
        carryoverCredits,
        creditsResetAt,
        polarCustomerId,
        polarSubscriptionId,
        ideasSubscriptionTier,
        ideasSubscriptionStatus,
        ideasPolarSubscriptionId
      FROM users 
      WHERE id = ?
    `).bind(userId).first()

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Determine limit based on tier
        // User has unlimited access if they have rynk-web pro OR ideas-only subscription
        const webTier = (user.subscriptionTier as string) || 'free'
        const ideasTier = (user.ideasSubscriptionTier as string) || 'free'
        const hasWebPro = webTier === 'standard' || webTier === 'standard_plus' || webTier === 'pro'
        const hasIdeasPro = ideasTier === 'ideas'
        const limit = (hasWebPro || hasIdeasPro) ? -1 : 50

        // Calculate usage for current month
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const usageResult = await db.prepare(`
        SELECT COUNT(*) as count
        FROM dumps
        WHERE userId = ? AND createdAt >= ?
    `).bind(userId, startOfMonth).first()

        const dumpCount = (usageResult?.count as number) || 0

        const subscriptionStatus: SubscriptionStatus = {
            tier: (user.subscriptionTier as SubscriptionStatus['tier']) || 'free',
            status: (user.subscriptionStatus as SubscriptionStatus['status']) || 'none',
            ideasTier: (user.ideasSubscriptionTier as SubscriptionStatus['ideasTier']) || 'free',
            ideasStatus: (user.ideasSubscriptionStatus as SubscriptionStatus['ideasStatus']) || 'none',
            credits: (user.credits as number) || 0,
            carryoverCredits: (user.carryoverCredits as number) || 0,
            creditsResetAt: user.creditsResetAt as string | null,
            polarCustomerId: user.polarCustomerId as string | null,
            polarSubscriptionId: user.polarSubscriptionId as string | null,
            ideasPolarSubscriptionId: user.ideasPolarSubscriptionId as string | null,
            usage: {
                periodStart: startOfMonth,
                dumpCount,
                limit
            }
        }

        return NextResponse.json(subscriptionStatus)

    } catch (error: any) {
        console.error('❌ [Subscription Status] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to get subscription status' }, { status: 500 })
    }
}
