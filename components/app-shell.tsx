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
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-none w-[52px] border-r border-border/30 flex-col items-center py-4 gap-1">
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

                {/* Settings or Sign In */}
                {!user ? (
                    <button
                        onClick={() => window.location.href = "/api/auth/signin"}
                        className="sidebar-icon"
                        title="Sign In"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" x2="3" y1="12" y2="12" />
                        </svg>
                    </button>
                ) : (
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
                                <div className="p-1.5 space-y-1">
                                    <button
                                        onClick={() => {
                                            setSettingsOpen(false);
                                            window.location.href = "/settings/subscription";
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-3 py-2 rounded-lg",
                                            "text-sm text-muted-foreground/80",
                                            "hover:bg-card/80 hover:text-foreground",
                                            "transition-colors"
                                        )}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <line x1="2" y1="10" x2="22" y2="10" />
                                            <line x1="7" y1="15" x2="7.01" y2="15" />
                                            <line x1="11" y1="15" x2="13" y2="15" />
                                        </svg>
                                        Subscription
                                    </button>
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
                )}
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 overflow-auto pb-20 md:pb-0">
                {children}
            </main>
            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe">
                <div className="flex items-center justify-around h-16 px-2">
                    <button
                        onClick={() => window.location.href = "/"}
                        className={cn(
                            "flex flex-col items-center justify-center w-16 gap-1",
                            "text-muted-foreground/40 transition-colors",
                            pathname === "/" && "text-foreground"
                        )}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        <span className="text-[9px] font-medium tracking-wide">BOARD</span>
                    </button>

                    <button
                        onClick={() => setDumpOpen(true)}
                        className="flex flex-col items-center justify-center w-16 gap-1 text-muted-foreground/40 hover:text-foreground transition-colors"
                    >
                        <div className="p-2 rounded-full bg-foreground text-background shadow-lg transform -translate-y-4 border-4 border-background">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </div>
                    </button>

                    {!user ? (
                        <button
                            onClick={() => window.location.href = "/api/auth/signin"}
                            className="flex flex-col items-center justify-center w-16 gap-1 text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" x2="3" y1="12" y2="12" />
                            </svg>
                            <span className="text-[9px] font-medium tracking-wide">SIGN IN</span>
                        </button>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-16 gap-1",
                                    "text-muted-foreground/40 transition-colors",
                                    settingsOpen && "text-foreground"
                                )}
                            >
                                {user?.image ? (
                                    <img src={user.image} alt="" className="w-5 h-5 rounded-full" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                                        {initials}
                                    </div>
                                )}
                                <span className="text-[9px] font-medium tracking-wide">YOU</span>
                            </button>

                            {settingsOpen && (
                                <div className={cn(
                                    "absolute right-0 bottom-full mb-4",
                                    "w-64 rounded-2xl shadow-2xl",
                                    "bg-card border border-border/50",
                                    "animate-fade-slide-up",
                                    "z-50 overflow-hidden"
                                )}>
                                    <div className="p-4 bg-muted/30 border-b border-border/30">
                                        <div className="flex items-center gap-3">
                                            {user?.image ? (
                                                <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                                    {initials}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">
                                                    {user?.name || "User"}
                                                </div>
                                                <div className="text-xs text-muted-foreground/50 truncate">
                                                    {user?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setSettingsOpen(false);
                                                window.location.href = "/settings/subscription";
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-foreground hover:bg-muted/50 transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                                <line x1="2" y1="10" x2="22" y2="10" />
                                                <line x1="7" y1="15" x2="7.01" y2="15" />
                                                <line x1="11" y1="15" x2="13" y2="15" />
                                            </svg>
                                            Subscription
                                        </button>
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/login" })}
                                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    )}
                </div>
            </nav>

            {/* Dump Modal */}
            <DumpModal
                open={dumpOpen}
                onClose={() => setDumpOpen(false)}
                onComplete={handleDumpComplete}
            />
        </div>
    );
}

