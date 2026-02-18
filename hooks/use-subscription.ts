import { useState, useEffect } from 'react'
import { SubscriptionStatus } from '@/types/subscription'

export function useSubscription() {
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSubscription() {
            try {
                const res = await fetch('/api/subscription/status')
                if (!res.ok) {
                    if (res.status === 401) {
                        // User not logged in, ignore
                        setLoading(false)
                        return
                    }
                    throw new Error('Failed to fetch subscription status')
                }

                const data = await res.json()
                setSubscription(data)
            } catch (err: any) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchSubscription()
    }, [])

    const isPro = subscription?.tier === 'standard' || subscription?.tier === 'standard_plus' || subscription?.tier === 'pro'
    const isFree = !isPro

    return {
        subscription,
        loading,
        error,
        isPro,
        isFree
    }
}
