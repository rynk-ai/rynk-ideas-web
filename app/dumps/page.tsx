"use client";

import { useState } from "react";
import { useDumps } from "@/hooks/use-rynk-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function DumpsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const { dumps, loading } = useDumps(debouncedSearch);
    const tc = useTranslations("common");

    // Basic debounce for search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        // We'll use a simple timeout for debouncing
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(e.target.value);
        }, 300);
        return () => clearTimeout(timeoutId);
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    All Dumps
                </h1>
                <div className="relative w-full sm:w-72">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search dumps..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-card/40 border border-border/40 focus:border-foreground/20 focus:outline-none focus:ring-0 transition-colors text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="text-sm text-muted-foreground/70 animate-pulse">
                        {tc("loading")}
                    </div>
                </div>
            ) : dumps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                    <p className="text-sm text-muted-foreground">No dumps found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {dumps.map((dump) => (
                        <div
                            key={dump.id}
                            className="p-5 md:p-6 rounded-2xl bg-card/40 border border-border/30 hover:border-border/60 hover:bg-card/60 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-muted-foreground/80">
                                    {new Date(dump.createdAt).toLocaleString(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </span>
                                {dump.contentType !== "text" && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                                        {dump.contentType}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                {dump.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}