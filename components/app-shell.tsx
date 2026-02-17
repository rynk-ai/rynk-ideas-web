"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { DumpModal } from "./dump-modal";

interface AppShellProps {
    children: React.ReactNode;
}



export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;
    const [dumpOpen, setDumpOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const handleDumpComplete = useCallback(() => {
        setDumpOpen(false);
        window.location.reload();
    }, []);


    // ⌘K to open dump modal
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setDumpOpen(true);
            }
            if (e.key === "Escape") {
                setSettingsOpen(false);
            }
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // Close settings on click outside
    useEffect(() => {
        if (!settingsOpen) return;
        function handleClick(e: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [settingsOpen]);

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    return (
        <div className="min-h-screen flex bg-background">
            {/* Sidebar */}
            <aside className="flex-none w-[52px] border-r border-border/30 flex flex-col items-center py-4 gap-1">
                {/* Brand */}
                <a href="/" className="mb-4 group" title="rynk ideas">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-muted-foreground/50 group-hover:text-foreground transition-colors">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.1" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                </a>

                {/* Nav icons */}
                <button
                    onClick={() => window.location.href = "/"}
                    className={cn(
                        "sidebar-icon",
                        pathname === "/" && "sidebar-icon-active"
                    )}
                    title="Board"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                </button>

                <button
                    onClick={() => setDumpOpen(true)}
                    className="sidebar-icon"
                    title="Quick Dump"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Settings */}
                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className={cn(
                            "sidebar-icon",
                            settingsOpen && "sidebar-icon-active"
                        )}
                        title="Settings"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>

                    {/* Popover */}
                    {settingsOpen && (
                        <div className={cn(
                            "absolute left-[56px] bottom-0",
                            "w-56 rounded-xl shadow-xl",
                            "bg-card border border-border/50",
                            "animate-fade-slide-up",
                            "z-50"
                        )}>
                            {/* User info */}
                            <div className="p-4 border-b border-border/30">
                                <div className="flex items-center gap-3">
                                    {user?.image ? (
                                        <img
                                            src={user.image}
                                            alt=""
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                            {initials}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-foreground/90 truncate">
                                            {user?.name || "User"}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground/40 truncate">
                                            {user?.email || ""}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-1.5">
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className={cn(
                                        "flex items-center gap-2 w-full px-3 py-2 rounded-lg",
                                        "text-sm text-muted-foreground/60",
                                        "hover:bg-card/80 hover:text-foreground",
                                        "transition-colors"
                                    )}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" x2="9" y1="12" y2="12" />
                                    </svg>
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 overflow-auto">
                {children}
            </main>

            {/* Dump Modal */}
            <DumpModal
                open={dumpOpen}
                onClose={() => setDumpOpen(false)}
                onComplete={handleDumpComplete}
            />
        </div>
    );
}

