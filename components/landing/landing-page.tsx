"use client";

import { LandingHero } from "@/components/landing/landing-hero";
import { LandingBody } from "@/components/landing/landing-body";
import { LandingFooter } from "@/components/landing/landing-footer";

export function LandingPage() {
  return (
    <div
      className="flex-1 w-full min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground flex flex-col"
    >
      <main className="flex-1 flex flex-col">
        <LandingHero />
        <LandingBody />
      </main>
      <LandingFooter />
    </div>
  );
}
