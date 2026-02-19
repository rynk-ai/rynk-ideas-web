"use client";

import { cn } from "@/lib/utils";
import { useThreads } from "@/hooks/use-rynk-data";
import { OnboardingContent } from "@/components/onboarding-content";

const COLUMNS = [
    { key: "seed", label: "TO EXPLORE" },
    { key: "active", label: "THINKING ABOUT" },
    { key: "deciding", label: "DECIDING" },
    { key: "stuck", label: "STUCK" },
    { key: "parked", label: "ON HOLD" },
    { key: "done", label: "RESOLVED" },
];

export default function BoardPage() {
    const { threads, loading } = useThreads();

    const grouped = COLUMNS.map((col) => ({
        ...col,
        threads: threads.filter((t) => t.state === col.key),
    })).filter((col) => col.threads.length > 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-sm text-muted-foreground/40 animate-pulse">
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
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-lg font-semibold tracking-tight">
                    <span className="gradient-text">rynk</span>{" "}
                    <span className="text-foreground/80">ideas</span>
                </h1>
            </div>

            {/* Kanban */}
            <div className="max-w-6xl mx-auto">
                <div className="flex gap-4 md:gap-5 overflow-x-auto pb-24 md:pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none no-scrollbar">
                    {grouped.map((column) => (
                        <div
                            key={column.key}
                            className="flex-none w-[85vw] md:w-[260px] snap-center md:snap-align-none"
                        >
                            {/* Column header */}
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <span className="text-[11px] font-mono font-medium tracking-widest text-muted-foreground/40 uppercase">
                                    {column.label}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground/20">
                                    {column.threads.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="space-y-2.5">
                                {column.threads.map((thread) => (
                                    <div
                                        key={thread.id}
                                        className="group block"
                                    >
                                        <a href={`/thread/${thread.id}`} className={cn(
                                            "block rounded-lg p-4",
                                            "bg-card/60 border border-border/30",
                                            "hover:border-border/60 hover:bg-card/80",
                                            "transition-all duration-150"
                                        )}>
                                            <h3 className="text-[13px] font-semibold text-foreground/90 leading-snug mb-1 line-clamp-2">
                                                {thread.title}
                                            </h3>
                                            {thread.summary && (
                                                <p className="text-[12px] text-muted-foreground/40 leading-relaxed line-clamp-2">
                                                    {thread.summary}
                                                </p>
                                            )}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
