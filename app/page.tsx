"use client";

import { cn } from "@/lib/utils";
import { useThreads } from "@/hooks/use-rynk-data";
import { OnboardingContent } from "@/components/onboarding-content";

const STATE_CONFIG: Record<string, { label: string; className: string }> = {
    seed: { label: "Exploring", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    deciding: { label: "Deciding", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    stuck: { label: "Stuck", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    parked: { label: "Parked", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    done: { label: "Resolved", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

export default function BoardPage() {
    const { threads, loading } = useThreads();



    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-sm text-muted-foreground/70 animate-pulse">
                    Loading…
                </div>
            </div>
        );
    }

    if (threads.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="max-w-md w-full">
                    <OnboardingContent
                        className="bg-card/40 border border-border/30 rounded-2xl p-8 shadow-sm"
                        onComplete={() => {
                            // Trigger dump modal via keyboard shortcut simulation
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">


            {/* Masonry Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
                    {threads.map((thread) => {
                        const stateCfg = STATE_CONFIG[thread.state] || STATE_CONFIG.seed;
                        return (
                            <div
                                key={thread.id}
                                className="break-inside-avoid"
                            >
                                <a href={`/thread/${thread.id}`} className={cn(
                                    "block rounded-2xl p-5 md:p-6",
                                    "bg-card/40 border border-border/30",
                                    "hover:border-border/60 hover:bg-card/60",
                                    "transition-all duration-200"
                                )}>
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h3 className="text-sm md:text-base font-medium text-foreground leading-snug">
                                            {thread.title}
                                        </h3>
                                        {/* State Badge */}
                                        <span className={cn(
                                            "flex-none inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                            stateCfg.className
                                        )}>
                                            {stateCfg.label}
                                        </span>
                                    </div>
                                    {thread.summary && (
                                        <p className="text-[13px] text-muted-foreground/80 leading-relaxed line-clamp-4">
                                            {thread.summary}
                                        </p>
                                    )}
                                </a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
