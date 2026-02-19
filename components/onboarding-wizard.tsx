"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { OnboardingContent } from "./onboarding-content";

const ONBOARDING_KEY = "rynk-ideas-onboarding-completed";

export function OnboardingWizard() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const completed = localStorage.getItem(ONBOARDING_KEY);
        if (!completed) {
            // Small delay to not be jarring
            setTimeout(() => setOpen(true), 1000);
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem(ONBOARDING_KEY, "true");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val: boolean) => !val && handleComplete()}>
            <DialogContent className="sm:max-w-[425px]">
                <OnboardingContent onComplete={handleComplete} isModal />
            </DialogContent>
        </Dialog>
    );
}
