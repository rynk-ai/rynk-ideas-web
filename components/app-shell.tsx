"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { DumpModal } from "./dump-modal";
import { useAppLocale } from "./providers/locale-provider";
import { locales, type Locale } from "@/lib/i18n";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const isThreadPage = pathname?.startsWith("/thread/");
    const { data: session } = useSession();
    const user = session?.user;
    const [dumpOpen, setDumpOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const mobileSettingsRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    const t = useTranslations("appShell");
    const tLang = useTranslations("language");
    const { locale, setLocale } = useAppLocale();

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
                setLangOpen(false);
            }
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    // Close settings/lang on click outside
    useEffect(() => {
        if (!settingsOpen && !langOpen) return;
        function handleClick(e: MouseEvent) {
            const target = e.target as Node;
            if (settingsOpen) {
                const clickedDesktop = settingsRef.current?.contains(target);
                const clickedMobile = mobileSettingsRef.current?.contains(target);
                if (!clickedDesktop && !clickedMobile) {
                    setSettingsOpen(false);
                }
            }
            if (langOpen && langRef.current && !langRef.current.contains(target)) {
                setLangOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [settingsOpen, langOpen]);

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?";

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Top Navigation */}
            <header className="flex-none h-14 md:h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
                {/* Brand */}
                <a href="/" className="flex items-center gap-2 group" title="rynk ideas">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-lg font-semibold tracking-tight">
                            <span className="gradient-text">rynk</span>{" "}
                            <span className="text-foreground/80">ideas</span>
                        </h1>
                    </div>
                </a>

                <div className="flex items-center gap-3 md:gap-4">
                    {/* Language Switcher */}
                    <div className="relative" ref={langRef}>
                        <button
                            onClick={() => { setLangOpen(!langOpen); setSettingsOpen(false); }}
                            className={cn(
                                "flex items-center gap-1.5 p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                langOpen && "text-foreground bg-muted/50"
                            )}
                            title={tLang("label")}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                <path d="M2 12h20" />
                            </svg>
                            <span className="hidden md:inline text-xs font-medium">{tLang(locale)}</span>
                        </button>

                        {langOpen && (
                            <div className={cn(
                                "absolute right-0 top-full mt-2 w-48 max-h-80 overflow-y-auto rounded-xl shadow-xl",
                                "bg-card border border-border/50",
                                "animate-fade-slide-up origin-top-right",
                                "z-50"
                            )}>
                                <div className="p-1">
                                    {locales.map((loc) => (
                                        <button
                                            key={loc}
                                            onClick={() => { setLocale(loc); setLangOpen(false); }}
                                            className={cn(
                                                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                                                loc === locale
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {tLang(loc)}
                                            {loc === locale && (
                                                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Dump Button */}
                    <button
                        onClick={() => setDumpOpen(true)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors text-sm"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        {t("newDump")} <span className="text-background/60 ml-1 text-xs font-mono">⌘K</span>
                    </button>

                    {/* Settings or Sign In */}
                    {!user ? (
                        <button
                            onClick={() => window.location.href = "/api/auth/signin"}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t("signIn")}
                        </button>
                    ) : (
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => { setSettingsOpen(!settingsOpen); setLangOpen(false); }}
                                className={cn(
                                    "flex p-0.5 rounded-full border-2 transition-colors",
                                    settingsOpen ? "border-foreground" : "border-transparent hover:border-border"
                                )}
                                title={t("settings")}
                            >
                                {user?.image ? (
                                    <img
                                        src={user.image}
                                        alt=""
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-full"
                                    />
                                ) : (
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-semibold">
                                        {initials}
                                    </div>
                                )}
                            </button>

                            {/* Settings Dropdown */}
                            {settingsOpen && (
                                <div className={cn(
                                    "absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl",
                                    "bg-card border border-border/50",
                                    "animate-fade-slide-up origin-top-right",
                                    "z-50 overflow-hidden"
                                )}>
                                    <div className="p-4 bg-muted/20 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            {user?.image ? (
                                                <img
                                                    src={user.image}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center text-sm font-semibold">
                                                    {initials}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">
                                                    {user?.name || "User"}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {user?.email || ""}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-1 space-y-0.5">
                                        <button
                                            onClick={() => {
                                                setSettingsOpen(false);
                                                window.location.href = "/settings/subscription";
                                            }}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                                <line x1="2" y1="10" x2="22" y2="10" />
                                                <line x1="7" y1="15" x2="7.01" y2="15" />
                                                <line x1="11" y1="15" x2="13" y2="15" />
                                            </svg>
                                            {t("subscription")}
                                        </button>
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/login" })}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" x2="9" y1="12" y2="12" />
                                            </svg>
                                            {t("signOut")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-6">
                {children}
            </main>
            {/* Mobile FAB */}
            {!isThreadPage && (
                <div className="md:hidden fixed bottom-6 right-6 z-40 animate-fade-slide-up">
                    <button
                        onClick={() => setDumpOpen(true)}
                        className="flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        title={t("quickDump")}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Dump Modal */}
            <DumpModal
                open={dumpOpen}
                onClose={() => setDumpOpen(false)}
                onComplete={handleDumpComplete}
            />
        </div>
    );
}
