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
    const processDump = useCallback(async (dumpId: string) => {
        // Trigger pipeline
        await fetch("/api/pipeline/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dumpId }),
        });
    }, []);

    return { processDump };
}

