"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSaveDump, useProcessDump } from "@/hooks/use-rynk-data";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
    const { data: session } = useSession();
    const [content, setContent] = useState("");
    const [phase, setPhase] = useState<Phase>("writing");
    const [processingMsg, setProcessingMsg] = useState(PROCESSING_MESSAGES[0]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { saveDump } = useSaveDump();
    const { processDump } = useProcessDump();

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
            const result = await saveDump(content.trim());

            setPhase("processing");
            const processResult = await processDump(result.id);

            setPhase("done");

            if (processResult?.affectedThreadTitles?.length > 0) {
                toast.success(`Good Job working on ${processResult.affectedThreadTitles.join(", ")}`);
            } else {
                toast.success("Thought captured securely.");
            }

            setTimeout(() => {
                onComplete();
            }, 800);
        } catch (error: any) {
            console.error("Failed:", error);
            setPhase("writing");

            if (error.message === "LIMIT_REACHED") {
                toast.info("Free limit reached", {
                    description: "You've used your guest credits. Sign in to continue dumping thoughts.",
                    action: {
                        label: "Sign In",
                        onClick: () => window.location.href = "/api/auth/signin"
                    },
                    duration: 8000,
                });
            } else {
                toast.error("Failed to save thought. Please try again.");
            }
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
                className="absolute inset-0 bg-background/95 backdrop-blur-2xl animate-fade-in"
            />

            {/* Modal Container */}
            <div
                className="absolute inset-0 flex flex-col p-6"
                onClick={(e) => {
                    if (e.target === e.currentTarget && phase === "writing") {
                        onClose();
                    }
                }}
            >
                {/* Header Actions */}
                {phase === "writing" && (
                    <div className="flex justify-end w-full max-w-5xl mx-auto pt-4 pb-12 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                            onClick={onClose}
                            className="p-3 rounded-full hover:bg-muted transition-colors flex items-center gap-2 text-sm"
                            title="Close (Esc)"
                        >
                            <span className="hidden md:block text-muted-foreground mr-1">Close</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Main Input Area */}
                <div className={cn(
                    "relative w-full max-w-3xl mx-auto flex-1 flex flex-col",
                    "animate-fade-slide-up"
                )}>
                    {phase === "writing" ? (
                        <div className="flex-1 flex flex-col justify-center">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="What's on your mind?"
                                className={cn(
                                    "w-full min-h-[30vh] max-h-[70vh]",
                                    "bg-transparent text-foreground text-3xl md:text-5xl font-light leading-snug md:leading-tight tracking-tight",
                                    "placeholder:text-muted-foreground/30",
                                    "focus:outline-none resize-none"
                                )}
                            />

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40 opacity-70 focus-within:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2">
                                    <button className="p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Attach">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    </button>
                                    <button className="p-3 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Voice">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    {content.trim().length > 0 && (
                                        <span className="hidden md:inline text-sm text-muted-foreground/50 font-mono tracking-widest">
                                            ⌘ ENTER
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!content.trim()}
                                        className={cn(
                                            "px-6 py-3 rounded-full text-base font-medium transition-all",
                                            "bg-foreground text-background hover:scale-[1.02]",
                                            "disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        )}
                                    >
                                        Dump
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
