"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";

export function LandingHero() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".hero-heading", {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })
      .from(
        ".hero-subhead",
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6"
      )
      .from(
        ".hero-cta",
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      )
      .from(
        ".hero-preview",
        {
          y: 60,
          opacity: 0,
          duration: 1.2,
          ease: "back.out(1.2)",
        },
        "-=0.4"
      );
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex flex-col items-center pt-24 pb-8 px-6 overflow-hidden"
    >
      {/* Content wrapper */}
      <div className="relative z-10 w-full flex flex-col items-start sm:items-center space-y-6 sm:space-y-8">
        {/* Headline */}
        <h1 className="hero-heading text-left sm:text-center max-w-4xl font-bold tracking-tight text-4xl sm:text-5xl md:text-7xl leading-[1.1]">
          Write it down. We'll figure out where it goes.
        </h1>

        {/* Subhead */}
        <p className="hero-subhead text-lg md:text-xl text-muted-foreground text-left sm:text-center max-w-2xl leading-relaxed text-balance">
          Your brain isn't a filing cabinet. Just type out what's on your mind—no folders, no tags, no stress. Rynk quietly connects your related thoughts in the background.
        </p>

        {/* CTAs */}
        <div className="hero-cta flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-4 mt-6">
          <Link href="/board" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm transition-all duration-200">
              Drop a thought <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Removed Redundant Mock Component Display */}
      <div className="hero-preview relative z-10 w-full max-w-5xl mt-12 md:mt-16 border-t border-border/40" />
    </section>
  );
}
