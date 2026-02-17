"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Thread {
    id: string;
    title: string;
    summary: string | null;
    state: string;
    groundingNote: string | null;
}

const COLUMNS = [
    { key: "seed", label: "TO EXPLORE" },
    { key: "active", label: "THINKING ABOUT" },
    { key: "deciding", label: "DECIDING" },
    { key: "stuck", label: "STUCK" },
    { key: "parked", label: "ON HOLD" },
    { key: "done", label: "RESOLVED" },
];

export default function BoardPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchThreads() {
            try {
                const res = await fetch("/api/threads");
                const data = await res.json();
                setThreads(data.threads || []);
            } catch (error) {
                console.error("Failed to fetch threads:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchThreads();
    }, []);

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
                <div className="text-center max-w-md">
                    <h2 className="text-lg font-semibold mb-2 text-foreground/80">
                        No ideas yet
                    </h2>
                    <p className="text-sm text-muted-foreground/50 leading-relaxed mb-6">
                        Hit the pen icon in the sidebar or press{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-card border border-border/50 text-[11px] font-mono">
                            ⌘ K
                        </kbd>{" "}
                        to dump your first thought.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-lg font-semibold tracking-tight">
                    <span className="gradient-text">rynk</span>{" "}
                    <span className="text-foreground/80">ideas</span>
                </h1>
            </div>

            {/* Kanban */}
            <div className="max-w-6xl mx-auto">
                <div className="flex gap-5 overflow-x-auto pb-4">
                    {grouped.map((column) => (
                        <div
                            key={column.key}
                            className="flex-none w-[260px]"
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
                                    <a
                                        key={thread.id}
                                        href={`/thread/${thread.id}`}
                                        className="group block"
                                    >
                                        <div className={cn(
                                            "rounded-lg p-4",
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
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
