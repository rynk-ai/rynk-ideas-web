"use client"

import { useSubscription } from "@/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, Loader2 } from "lucide-react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

function SubscriptionContent() {
    const { subscription, loading, isPro } = useSubscription()
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const t = useTranslations("subscription")

    // Show success toast if redirected back from checkout
    if (searchParams.get("success") === "true" && !loading) {
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
                toast.error(t("checkoutFailed"))
            }
        } catch (error) {
            console.error(error)
            toast.error(t("error"))
        } finally {
            setCheckoutLoading(null)
        }
    }

    const handleManageSubscription = () => {
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
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">
                    {t("description")}
                </p>
            </div>

            {/* Usage Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("currentUsage")}</CardTitle>
                    <CardDescription>
                        {limit === -1
                            ? t("unlimitedAccess")
                            : t("usageOf", { usage, limit })
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {limit !== -1 && (
                        <div className="space-y-2">
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground text-right">
                                {t("dumps", { usage, limit })}
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
                        <CardTitle>{t("free.name")}</CardTitle>
                        <CardDescription>{t("free.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="text-3xl font-bold">{t("free.price")}<span className="text-sm font-normal text-muted-foreground">{t("free.perMonth")}</span></div>
                        <ul className="grid gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                {t("free.features.dumps")}
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                {t("free.features.ai")}
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled={!isPro}>
                            {!isPro ? t("currentPlan") : t("downgrade")}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Standard Plan */}
                <Card className={isPro ? "border-primary relative overflow-hidden" : "relative overflow-hidden"}>
                    {isPro && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                            {t("standard.current")}
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle>{t("standard.name")}</CardTitle>
                        <CardDescription>{t("standard.description")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="text-3xl font-bold">{t("standard.price")}<span className="text-sm font-normal text-muted-foreground">{t("standard.perMonth")}</span></div>
                        <ul className="grid gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                {t("standard.features.dumps")}
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                {t("standard.features.ai")}
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                {t("standard.features.support")}
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <Button className="w-full" variant="outline" onClick={handleManageSubscription}>
                                {t("manageSubscription")}
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                onClick={() => handleCheckout("standard")}
                                disabled={!!checkoutLoading}
                            >
                                {checkoutLoading === "standard" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("upgradeToStandard")}
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
