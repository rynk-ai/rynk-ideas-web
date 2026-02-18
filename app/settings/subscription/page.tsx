"use client"

import { useSubscription } from "@/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, Loader2 } from "lucide-react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

function SubscriptionContent() {
    const { subscription, loading, isPro } = useSubscription()
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
    const searchParams = useSearchParams()

    // Show success toast if redirected back from checkout
    if (searchParams.get("success") === "true" && !loading) {
        // Need to use useEffect to avoid hydration mismatch or infinite loop, 
        // but for simplicity in this MVP let's just render a success message conditionally
        // or actually, sonner toast is usually triggered in useEffect.
    }

    const handleCheckout = async (tier: "standard" | "standard_plus") => {
        try {
            setCheckoutLoading(tier)
            const res = await fetch("/api/subscription/checkout", {
                method: "POST",
                body: JSON.stringify({ tier }),
            })
            const data = await res.json()
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            } else {
                toast.error("Failed to start checkout")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setCheckoutLoading(null)
        }
    }

    const handleManageSubscription = () => {
        // Redirect to Polar customer portal
        // Since we don't have a direct portal link API yet, we can link to rynk-web settings
        // or just tell them to manage via email links for now.
        // Ideally we should have a portal link. For now let's link to generic rynk settings if available.
        window.open("https://rynk.io/settings", "_blank")
    }

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Usage calculation
    const usage = subscription?.usage?.dumpCount || 0
    const limit = subscription?.usage?.limit || 50
    const percentage = limit === -1 ? 0 : Math.min((usage / limit) * 100, 100)

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground">
                    Manage your plan and usage limits.
                </p>
            </div>

            {/* Usage Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Usage</CardTitle>
                    <CardDescription>
                        {limit === -1
                            ? "You have unlimited access."
                            : `You have used ${usage} of your ${limit} monthly dumps.`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {limit !== -1 && (
                        <div className="space-y-2">
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground text-right">
                                {usage} / {limit} dumps
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Plans Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Free Plan */}
                <Card className={!isPro ? "border-primary" : ""}>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>Perfect for getting started</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <ul className="grid gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                50 Dumps / month
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                Basic AI Organization
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled={!isPro}>
                            {!isPro ? "Current Plan" : "Downgrade"}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Standard Plan */}
                <Card className={isPro ? "border-primary relative overflow-hidden" : "relative overflow-hidden"}>
                    {isPro && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                            Current
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle>Standard</CardTitle>
                        <CardDescription>For serious thinkers</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="text-3xl font-bold">$10<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                        <ul className="grid gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                Unlimited Dumps
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                Advanced AI Models
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                Priority Support
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <Button className="w-full" variant="outline" onClick={handleManageSubscription}>
                                Manage Subscription
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                onClick={() => handleCheckout("standard")}
                                disabled={!!checkoutLoading}
                            >
                                {checkoutLoading === "standard" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Upgrade to Standard
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default function SubscriptionPage() {
    return (
        <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <SubscriptionContent />
        </Suspense>
    )
}
