"use client"

import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

function LoginForm() {
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"
    const error = searchParams.get("error")
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        await signIn("google", { callbackUrl })
    }

    return (
        <div className="flex w-full max-w-sm flex-col items-center space-y-8 p-8">
            {/* Brand */}
            <div className="flex flex-col items-center space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    <span className="gradient-text">rynk</span>{" "}
                    <span className="text-foreground">ideas.</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                    Your AI thinking partner. Dump your thoughts, get clarity.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="w-full rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
                    {error === "OAuthAccountNotLinked"
                        ? "This email is already associated with another account."
                        : "Something went wrong. Please try again."}
                </div>
            )}

            {/* Sign in */}
            <div className="w-full space-y-4">
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className={cn(
                        "flex w-full items-center justify-center gap-3 rounded-lg",
                        "border border-border bg-card px-4 py-3",
                        "text-sm font-medium text-foreground",
                        "hover:bg-accent transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-50",
                        "active:scale-[0.98]"
                    )}
                >
                    {isLoading ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" />
                        </svg>
                    ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    Continue with Google
                </button>
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground/50 text-center">
                Same account as rynk chat.
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Suspense fallback={
                <div className="flex w-full max-w-sm flex-col items-center space-y-8 p-8">
                    <div className="h-10 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                    <div className="h-12 w-full animate-pulse rounded bg-muted" />
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    )
}
