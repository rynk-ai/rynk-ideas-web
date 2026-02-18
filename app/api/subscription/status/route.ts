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

        // Fetch subscription info from database
        const user = await db.prepare(`
      SELECT 
        subscriptionTier,
        subscriptionStatus,
        credits,
        carryoverCredits,
        creditsResetAt,
        polarCustomerId,
        polarSubscriptionId
      FROM users 
      WHERE id = ?
    `).bind(userId).first()

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Determine limit based on tier
        // Free: 50 dumps/month. Paid: Unlimited (-1)
        const tier = (user.subscriptionTier as string) || 'free'
        const limit = tier === 'free' ? 50 : -1

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
            credits: (user.credits as number) || 0,
            carryoverCredits: (user.carryoverCredits as number) || 0,
            creditsResetAt: user.creditsResetAt as string | null,
            polarCustomerId: user.polarCustomerId as string | null,
            polarSubscriptionId: user.polarSubscriptionId as string | null,
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
