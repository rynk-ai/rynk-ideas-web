"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border mt-auto">
      {/* Final CTA */}
      <section className="py-16 md:py-32 px-4 sm:px-6 text-left sm:text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-start sm:items-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Your ideas need<br />
            a clear space.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 text-balance">
            Free to start. No credit card required.
          </p>
          <Link href="/board" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm">
              Start freewriting <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Utility Footer */}
      <div className="px-4 sm:px-6 py-8 border-t border-border/40">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          <Link href="/" className="inline-block">
            <span className="font-bold text-lg tracking-tight text-foreground">rynk ideas.</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="https://rynk.io/privacy" target="_blank" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="https://rynk.io/terms" target="_blank" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="https://twitter.com/rynkdotio" target="_blank" className="hover:text-foreground transition-colors">Twitter</Link>
          </div>

          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Rynk AI
          </p>
        </div>
      </div>
    </footer>
  );
}
