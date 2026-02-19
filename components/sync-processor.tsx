"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function GuestDataClaimer() {
    const { data: session } = useSession();
    const claimedRef = useRef(false);

    useEffect(() => {
        async function claimData() {
            if (!session?.user || claimedRef.current) return;

            // Prevent double-firing in strict mode
            claimedRef.current = true;

            try {
                const res = await fetch("/api/auth/claim", { method: "POST" });
                if (res.ok) {
                    const data = await res.json();
                    if (data.claimedDumps > 0 || data.claimedThreads > 0) {
                        toast.success(`Synced your thoughts to your account!`);
                        // Reload to show fresh data
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }
            } catch (error) {
                console.error("Failed to claim guest data:", error);
            }
        }

        claimData();
    }, [session]);

    return null;
}
