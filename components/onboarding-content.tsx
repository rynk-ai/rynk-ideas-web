"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Step = {
    title: string;
    description: string;
    image?: string;
};

const STEPS: Step[] = [
    {
        title: "Welcome to Rynk Ideas",
        description: "AI without the noise. Just dump your thoughts, and let AI organize them into actionable plans.",
    },
    {
        title: "Dump Anything",
        description: "Hit the pen icon or press ⌘K anywhere to capture a thought. Don't worry about structure.",
    },
    {
        title: "Let AI Do the Work",
        description: "We'll cluster your thoughts into threads, find connections, and help you turn them into reality.",
    },
];

interface OnboardingContentProps {
    onComplete?: () => void;
    className?: string;
    isModal?: boolean;
}

export function OnboardingContent({ onComplete, className, isModal = false }: OnboardingContentProps) {
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            onComplete?.();
        }
    };

    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                    {STEPS[step].title}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {STEPS[step].description}
                </p>
            </div>

            <div className="py-6 flex flex-col items-center justify-center gap-4 min-h-[150px] bg-muted/20 rounded-xl mb-6">
                {/* Placeholder for visual/animation */}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {step + 1}
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                i === step ? "bg-primary w-4" : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    {step === STEPS.length - 1 ? "Get Started" : "Next"}
                </button>
            </div>
        </div>
    );
}
