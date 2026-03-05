"use client";

import { useState, useEffect, use, useRef } from "react";
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
    const [order, setOrder] = useState<"desc" | "asc">("asc"); // Default to chat style (oldest first)
    const [newNote, setNewNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const endOfMessagesRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        // Auto-scroll to bottom of thread when segments load
        if (!loading && segments.length > 0) {
            scrollToBottom();
        }
    }, [loading, segments]);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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

            // Simple reload for now, ideally we'd optimistically update or fetch just the new segments
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
            <div className="flex items-center justify-center h-[100dvh]">
                <div className="text-sm text-muted-foreground/70 animate-pulse font-mono uppercase tracking-widest">
                    {tc("loading")}
                </div>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className="flex items-center justify-center h-[100dvh]">
                <div className="text-center animate-fade-in">
                    <p className="text-muted-foreground text-sm mb-4">{t("notFound")}</p>
                    <a href="/" className="text-sm text-primary hover:underline font-medium">{tc("back")}</a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-background">
            {/* Top Navigation Bar */}
            <header className="flex-none px-4 md:px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        {tc("back")}
                    </a>

                    <div className="flex gap-2">
                        <span className="text-[10px] font-mono tracking-widest text-muted-foreground/50 border border-border/40 px-2 py-1 rounded-md uppercase">
                            {t("state")} : {t(`stateLabels.${thread.state}`) || thread.state}
                        </span>
                    </div>
                </div>
            </header>

            {/* Scrollable Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col min-h-full pb-32">

                    {/* Header Section */}
                    <div className="mb-10 animate-fade-slide-up">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4 text-foreground text-balance">
                            {thread.title}
                        </h1>

                        {thread.summary && (
                            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                                {thread.summary}
                            </p>
                        )}

                        {/* Inline Edges/Connections */}
                        {edges.length > 0 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {edges.map((edge) => (
                                    <a
                                        key={edge.id}
                                        href={`/thread/${edge.connectedThreadId}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors border border-border/50"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                        {edge.connectedTitle}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Metadata Context (Grounding & Reason) */}
                    {(thread.groundingNote || thread.stateReason) && (
                        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-slide-up" style={{ animationDelay: '50ms' }}>
                            {thread.groundingNote && (
                                <div className="card-swiss p-4 rounded-xl border border-primary/20 bg-primary/5">
                                    <div className="swiss-label mb-2 text-primary/70">{t("groundingNote")}</div>
                                    <p className="text-sm text-foreground/90 italic text-pretty">
                                        &ldquo;{thread.groundingNote}&rdquo;
                                    </p>
                                </div>
                            )}

                            {thread.stateReason && (
                                <div className="card-swiss p-4 rounded-xl bg-muted/30">
                                    <div className="swiss-label mb-2">{t("whyThisState")}</div>
                                    <p className="text-sm text-foreground/80 text-pretty">
                                        {thread.stateReason}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="w-full h-px bg-border/40 mb-8" />

                    {/* Timeline / Chat Area */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="swiss-label">
                                {t("timeline")}
                            </h2>
                            <button
                                onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md swiss-mono text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", order === "desc" && "rotate-180")}>
                                    <path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />
                                </svg>
                                {order === "desc" ? t("newestFirst") : t("oldestFirst")}
                            </button>
                        </div>

                        {segments.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-muted-foreground swiss-subhead">{t("noEntries")}</p>
                                <p className="text-xs text-muted-foreground/60 mt-2">Add a note below to start capturing thoughts.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-4">
                                {(order === "desc" ? [...segments].reverse() : segments).map((segment, i) => (
                                    <div key={segment.id} className="group relative animate-fade-slide-up" style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}>
                                        {/* Timestamp */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                                                {friendlyDate(segment.createdAt)}
                                            </div>
                                            <div className="h-px flex-1 bg-border/20 group-hover:bg-border/60 transition-colors" />
                                        </div>

                                        {/* Markdown-ready content area */}
                                        <div className="pl-0 md:pl-4">
                                            <p className="text-base text-foreground/90 leading-relaxed text-pretty whitespace-pre-wrap">
                                                {segment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={endOfMessagesRef} className="h-4" />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Input Area */}
            <div className="flex-none bg-background/80 backdrop-blur-xl border-t border-border/40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="max-w-3xl mx-auto relative">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t("addNotePlaceholder")}
                        disabled={isSubmitting}
                        className="w-full min-h-[60px] md:min-h-[80px] p-3 md:p-4 pr-24 bg-card/50 border border-input rounded-xl text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring resize-none transition-all disabled:opacity-50 shadow-sm"
                        style={{ fieldSizing: "content", maxHeight: "200px" }}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                        {newNote.trim().length > 0 && (
                            <span className="hidden md:inline swiss-mono text-[9px] text-muted-foreground/40">
                                ⌘ Enter
                            </span>
                        )}
                        <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || isSubmitting}
                            className={cn(
                                "flex items-center justify-center p-2 rounded-lg font-medium transition-all shadow-sm",
                                newNote.trim() && !isSubmitting
                                    ? "bg-foreground text-background hover:scale-[1.05]"
                                    : "bg-muted text-muted-foreground"
                            )}
                            aria-label={t("add")}
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
