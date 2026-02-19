"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { AppShell } from "./app-shell";
import { GuestDataClaimer } from "./sync-processor";
import { OnboardingWizard } from "./onboarding-wizard";

const SHELL_EXCLUDED_PATHS = ["/login"];

export function ShellWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const shouldShowShell = !SHELL_EXCLUDED_PATHS.some((p) => pathname.startsWith(p));

    return (
        <SessionProvider>
            <GuestDataClaimer />
            <OnboardingWizard />
            {shouldShowShell ? (
                <AppShell>{children}</AppShell>
            ) : (
                children
            )}
        </SessionProvider>
    );
}
