"use client";

import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";

interface ThreadDetail {
    id: string;
    title: string;
    summary: string | null;
    state: string;
    stateReason: string | null;
    realityScore: number | null;
    groundingNote: string | null;
    momentum: string | null;
    segmentCount: number;
}

interface ThreadSegment {
    id: string;
    content: string;
    segmentType: string;
    createdAt: string;
}

interface ThreadEdge {
    id: string;
    connectedTitle: string;
    connectedThreadId: string;
}

function friendlyDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDay === 0) return "today";
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATE_LABELS: Record<string, string> = {
    seed: "New idea to explore",
    active: "Actively thinking about",
    deciding: "Decision needed",
    stuck: "Feeling stuck",
    parked: "On hold for now",
    done: "Resolved",
};

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [segments, setSegments] = useState<ThreadSegment[]>([]);
    const [edges, setEdges] = useState<ThreadEdge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchThread() {
            try {
                const res = await fetch(`/api/threads/${id}`);
                const data = await res.json();
                setThread(data.thread);
                setSegments(data.segments || []);
                setEdges(data.edges || []);
            } catch (error) {
                console.error("Failed to fetch thread:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchThread();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-sm text-muted-foreground/40 animate-pulse">
                    Loading…
                </div>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                    <p className="text-muted-foreground/50 text-sm mb-4">Thread not found</p>
                    <a href="/" className="text-sm text-primary hover:underline">← Back</a>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pb-16">
            <div className="max-w-2xl mx-auto">
                {/* Back link */}
                <a
                    href="/"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground/40 hover:text-muted-foreground transition-colors mb-8"
                >
                    ← Board
                </a>

                {/* Title + Meta */}
                <div className="mb-10">
                    <h1 className="text-2xl font-bold tracking-tight leading-tight mb-3">
                        {thread.title}
                    </h1>

                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground/40 font-mono text-xs">
                            {STATE_LABELS[thread.state] || thread.state}
                        </span>
                    </div>
                </div>

                {/* Grounding Note — the star, shown first */}
                {thread.groundingNote && (
                    <div className="card-grounding p-5 mb-10">
                        <div className="text-[11px] font-mono font-medium tracking-widest text-amber-400/60 uppercase mb-3">
                            Grounding Note
                        </div>
                        <p className="text-sm text-amber-100/90 leading-[1.8]">
                            {thread.groundingNote}
                        </p>
                    </div>
                )}

                {/* Summary */}
                {thread.summary && (
                    <div className="mb-10">
                        <p className="text-sm text-muted-foreground/80 leading-[1.8]">
                            {thread.summary}
                        </p>
                    </div>
                )}

                {/* State Reason */}
                {thread.stateReason && (
                    <div className="mb-10 pl-4 border-l-2 border-border/30">
                        <p className="text-sm text-muted-foreground/70 leading-[1.8]">
                            {thread.stateReason}
                        </p>
                    </div>
                )}

                {/* Timeline — newest first */}
                <div className="mb-10">
                    <h2 className="text-[11px] font-mono font-medium tracking-widest text-muted-foreground/30 uppercase mb-6">
                        Timeline
                    </h2>

                    {segments.length === 0 ? (
                        <p className="text-sm text-muted-foreground/30">No entries yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {[...segments].reverse().map((segment, i) => (
                                <div key={segment.id} className="relative">
                                    {/* Date */}
                                    <div className="text-[11px] font-mono text-muted-foreground/25 mb-2">
                                        {friendlyDate(segment.createdAt)}
                                    </div>

                                    {/* Content */}
                                    <div className="pl-4 border-l border-border/20">
                                        <p className="text-sm text-foreground/80 leading-[1.8] whitespace-pre-wrap">
                                            {segment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Connections — subtle text links */}
                {edges.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-[11px] font-mono font-medium tracking-widest text-muted-foreground/30 uppercase mb-4">
                            Related
                        </h2>
                        <div className="space-y-1.5">
                            {edges.map((edge) => (
                                <a
                                    key={edge.id}
                                    href={`/thread/${edge.connectedThreadId}`}
                                    className="block text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                                >
                                    → {edge.connectedTitle}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attribution */}
                <div className="text-right">
                    <span className="text-[10px] text-muted-foreground/15 font-mono">
                        rynk AI
                    </span>
                </div>
            </div>
        </div>
    );
}
