export interface SubscriptionStatus {
    tier: 'free' | 'standard' | 'standard_plus' | 'pro';
    status: 'none' | 'active' | 'canceled' | 'past_due';
    ideasTier: 'free' | 'ideas';
    ideasStatus: 'none' | 'active' | 'canceled' | 'past_due';
    credits: number;
    carryoverCredits: number;
    creditsResetAt: string | null;
    polarCustomerId: string | null;
    polarSubscriptionId: string | null;
    ideasPolarSubscriptionId: string | null;
    usage: {
        periodStart: string;
        dumpCount: number;
        limit: number; // 50 for free, -1 for unlimited
    };
}
