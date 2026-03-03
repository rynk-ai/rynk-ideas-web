"use client";

import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";
import { useSaveDump, useProcessDump } from "@/hooks/use-rynk-data";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/components/providers/locale-provider";

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

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [segments, setSegments] = useState<ThreadSegment[]>([]);
    const [edges, setEdges] = useState<ThreadEdge[]>([]);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<"desc" | "asc">("desc");
    const [newNote, setNewNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { saveDump } = useSaveDump();
    const { processDump } = useProcessDump();
    const t = useTranslations("thread");
    const tc = useTranslations("common");
    const { locale } = useAppLocale();

    function friendlyDate(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDay === 0) return t("dates.today");
        if (diffDay === 1) return t("dates.yesterday");
        if (diffDay < 7) return t("dates.daysAgo", { days: diffDay });
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

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

    async function handleAddNote() {
        if (!newNote.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await saveDump(newNote.trim());
            const processResult = await processDump(result.id, id, locale);

            setNewNote("");

            if (processResult?.threadsAffected > 0) {
                toast.success(t("toast.noteAdded"));
            } else {
                toast.success(t("toast.noteAddedSimple"));
            }

            // Reload to fetch new segments
            window.location.reload();
        } catch (error) {
            console.error("Failed to add note:", error);
            toast.error(t("toast.noteFailed"));
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleAddNote();
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-sm text-muted-foreground/70 animate-pulse">
                    {tc("loading")}
                </div>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-4">{t("notFound")}</p>
                    <a href="/" className="text-sm text-primary hover:underline">{tc("back")}</a>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 pb-40 md:pb-16">
            <div className="max-w-2xl mx-auto">
                {/* Back link */}
                <a
                    href="/"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground/70 hover:text-foreground transition-colors mb-8"
                >
                    {tc("back")}
                </a>

                {/* Title & Summary (Primary Focus) */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight mb-6 text-foreground">
                        {thread.title}
                    </h1>

                    {thread.summary && (
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
                            {thread.summary}
                        </p>
                    )}
                </div>

                {/* Metadata Row (Deprioritized) */}
                <div className="flex flex-wrap items-center gap-4 mb-12 py-4 border-y border-border/40">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">{t("state")}</span>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted/50 text-foreground/70">
                            {t(`stateLabels.${thread.state}`) || thread.state}
                        </span>
                    </div>
                </div>

                {/* Grounding Note */}
                {thread.groundingNote && (
                    <div className="mb-12 border-l-2 border-primary/30 pl-6 py-2">
                        <div className="text-[10px] font-mono font-medium tracking-widest text-primary/60 uppercase mb-3">
                            {t("groundingNote")}
                        </div>
                        <p className="text-base text-foreground/90 leading-relaxed italic">
                            &ldquo;{thread.groundingNote}&rdquo;
                        </p>
                    </div>
                )}

                {/* State Reason */}
                {thread.stateReason && (
                    <div className="mb-12 bg-muted/20 rounded-xl p-5 border border-border/40">
                        <div className="text-[10px] font-mono font-medium tracking-widest text-muted-foreground/60 uppercase mb-2">
                            {t("whyThisState")}
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            {thread.stateReason}
                        </p>
                    </div>
                )}

                {/* Timeline */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[11px] font-mono font-medium tracking-widest text-muted-foreground/70 uppercase">
                            {t("timeline")}
                        </h2>
                        <button
                            onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono font-medium tracking-widest text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors uppercase"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", order === "asc" && "rotate-180")}>
                                <path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />
                            </svg>
                            {order === "desc" ? t("newestFirst") : t("oldestFirst")}
                        </button>
                    </div>

                    {/* New Note Input */}
                    <div className="fixed bottom-0 left-0 w-full p-3 bg-background border-t border-border/40 z-40 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none md:pb-0 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 md:mb-8 md:z-auto">
                        <div className="relative max-w-2xl mx-auto">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t("addNotePlaceholder")}
                                disabled={isSubmitting}
                                className="w-full min-h-[60px] md:min-h-[100px] p-3 md:p-4 pb-12 bg-card/50 md:bg-card/30 border border-border/50 md:border-border/40 rounded-xl md:rounded-xl text-base md:text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-border/80 resize-none transition-colors disabled:opacity-50"
                            />
                            <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 flex items-center gap-2">
                                {newNote.trim().length > 0 && (
                                    <span className="hidden md:inline text-[10px] text-muted-foreground/50 font-mono tracking-widest uppercase">
                                        ⌘ Enter
                                    </span>
                                )}
                                <button
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim() || isSubmitting}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-foreground text-background hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all font-sans"
                                >
                                    {isSubmitting ? t("adding") : t("add")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {segments.length === 0 ? (
                        <p className="text-sm text-muted-foreground/70">{t("noEntries")}</p>
                    ) : (
                        <div className="space-y-6">
                            {(order === "desc" ? [...segments].reverse() : segments).map((segment, i) => (
                                <div key={segment.id} className="relative">
                                    {/* Date */}
                                    <div className="text-[11px] font-mono text-muted-foreground/60 mb-2">
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
                        <h2 className="text-[11px] font-mono font-medium tracking-widest text-muted-foreground/70 uppercase mb-4">
                            {t("related")}
                        </h2>
                        <div className="space-y-1.5">
                            {edges.map((edge) => (
                                <a
                                    key={edge.id}
                                    href={`/thread/${edge.connectedThreadId}`}
                                    className="block text-sm text-muted-foreground/80 hover:text-foreground transition-colors"
                                >
                                    → {edge.connectedTitle}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attribution */}
                <div className="text-right">
                    <span className="text-[10px] text-muted-foreground/40 font-mono">
                        rynk AI
                    </span>
                </div>
            </div>
        </div>
    );
}
