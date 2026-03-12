"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export interface Thread {
    id: string;
    title: string;
    summary: string | null;
    state: "seed" | "sprout" | "growing" | "blooming" | "withered";
    groundingNote: string | null;
}

export function useThreads() {
    const { data: session, status } = useSession();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchThreads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/threads");
            if (res.ok) {
                const data = await res.json();
                setThreads(data.threads || []);
            }
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]); // Re-fetch on mount. Dependencies minimized to avoid loops.

    return { threads, loading, refresh: fetchThreads };
}

export interface Dump {
    id: string;
    content: string;
    contentType: string;
    mediaUrls: string | null;
    createdAt: string;
    updatedAt: string;
}

export function useDumps(searchQuery?: string) {
    const { data: session, status } = useSession();
    const [dumps, setDumps] = useState<Dump[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDumps = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/dumps", window.location.origin);
            if (searchQuery) {
                url.searchParams.set("search", searchQuery);
            }
            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                setDumps(data.dumps || []);
            }
        } catch (error) {
            console.error("Failed to fetch dumps:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchDumps();
    }, [fetchDumps]);

    return { dumps, loading, refresh: fetchDumps };
}

export function useSaveDump() {
    const saveDump = useCallback(async (content: string) => {
        const res = await fetch("/api/dumps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });

        if (!res.ok) {
            if (res.status === 403) {
                throw new Error("LIMIT_REACHED");
            }
            throw new Error("Failed to save dump");
        }

        return await res.json();
    }, []);

    return { saveDump };
}

export function useProcessDump() {
    const processDump = useCallback(async (dumpId: string, threadId?: string, locale?: string) => {
        // Trigger pipeline
        const res = await fetch("/api/pipeline/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dumpId, threadId, locale }),
        });

        if (!res.ok) {
            throw new Error("Failed to process dump");
        }

        return await res.json();
    }, []);

    return { processDump };
}

