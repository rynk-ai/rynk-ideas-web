"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DumpModalProps {
    open: boolean;
    onClose: () => void;
    onComplete: () => void;
}

type Phase = "writing" | "saving" | "processing" | "done";

const PROCESSING_MESSAGES = [
    "Segmenting your thoughts…",
    "Finding patterns…",
    "Connecting to existing ideas…",
    "Synthesizing threads…",
];

export function DumpModal({ open, onClose, onComplete }: DumpModalProps) {
    const [content, setContent] = useState("");
    const [phase, setPhase] = useState<Phase>("writing");
    const [processingMsg, setProcessingMsg] = useState(PROCESSING_MESSAGES[0]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when modal opens
    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 100);
            setContent("");
            setPhase("writing");
        }
    }, [open]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
        }
    }, [content]);

    // Cycle processing messages
    useEffect(() => {
        if (phase !== "processing") return;
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % PROCESSING_MESSAGES.length;
            setProcessingMsg(PROCESSING_MESSAGES[i]);
        }, 2000);
        return () => clearInterval(interval);
    }, [phase]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape" && phase === "writing") {
                onClose();
            }
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, phase, onClose]);

    async function handleSubmit() {
        if (!content.trim() || phase !== "writing") return;

        setPhase("saving");
        try {
            const res = await fetch("/api/dumps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: content.trim(),
                    contentType: "text",
                }),
            });

            if (!res.ok) throw new Error("Failed to save");
            const data = await res.json();

            setPhase("processing");
            const pipelineRes = await fetch("/api/pipeline/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dumpId: data.id }),
            });

            if (!pipelineRes.ok) throw new Error("Pipeline failed");

            setPhase("done");
            setTimeout(() => {
                onComplete();
            }, 500);
        } catch (error) {
            console.error("Failed:", error);
            setPhase("writing");
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            />

            {/* Modal */}
            <div
                className="absolute inset-0 flex items-center justify-center p-6"
                onClick={(e) => {
                    if (e.target === e.currentTarget && phase === "writing") {
                        onClose();
                    }
                }}
            >
                <div className={cn(
                    "relative w-full w-[95vw] md:max-w-2xl",
                    "bg-card border border-border/50 rounded-2xl shadow-2xl",
                    "animate-fade-slide-up"
                )}>
                    {phase === "writing" && (
                        <button
                            onClick={onClose}
                            className="absolute right-3 top-3 p-2 rounded-lg text-muted-foreground/30 hover:text-foreground transition-colors z-10"
                            title="Close"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}

                    {phase === "writing" ? (
                        <div className="p-6">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What's on your mind?"
                                className={cn(
                                    "w-full min-h-[200px] max-h-[50vh]",
                                    "bg-transparent text-foreground text-base leading-relaxed",
                                    "placeholder:text-muted-foreground/25",
                                    "focus:outline-none resize-none",
                                    "font-sans"
                                )}
                            />

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                                <div className="flex items-center gap-1">
                                    <button className="p-2 rounded-lg text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" title="Attach">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    </button>
                                    <button className="p-2 rounded-lg text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" title="Voice">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    {content.trim().length > 0 && (
                                        <span className="hidden md:inline text-[11px] text-muted-foreground/25 font-mono">
                                            ⌘ Enter
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!content.trim()}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                            "bg-foreground text-background hover:bg-foreground/90",
                                            "disabled:opacity-50 disabled:cursor-not-allowed"
                                        )}
                                    >
                                        Dump it
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Processing state */
                        <div className="p-12 flex flex-col items-center gap-4">
                            <div className={cn(
                                "text-3xl transition-all duration-300",
                                phase === "done" ? "scale-110" : "animate-pulse"
                            )}>
                                {phase === "done" ? "✓" : "●"}
                            </div>
                            <p className={cn(
                                "text-sm text-muted-foreground transition-all",
                                phase === "done" && "text-emerald-400"
                            )}>
                                {phase === "saving" ? "Saving…" :
                                    phase === "processing" ? processingMsg :
                                        "Done"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
