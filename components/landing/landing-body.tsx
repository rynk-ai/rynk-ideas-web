"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brain, CornerDownLeft, FileText, Image as ImageIcon, Link2, Sparkles, LayoutDashboard, Telescope } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  {
    title: "1. Just write",
    heading: "Just start typing.",
    description: "No titles, no tags, no formatting required. Just drop your thoughts exactly as they come.",
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    mock: <MockDumpModal />
  },
  {
    title: "2. Automatic sorting",
    heading: "It quietly connects the dots.",
    description: "As you write, AI runs in the background to recognize patterns and group your related thoughts into ongoing threads.",
    icon: LayoutDashboard,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    mock: <MockBoardGrid />
  },
  {
    title: "3. See your progress",
    heading: "See the bigger picture.",
    description: "When you return to an idea, you'll see everything you've ever thought about it in one place, helping you figure out what to do next.",
    icon: Telescope,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    mock: <MockThreadEvolution />
  }
];

export function LandingBody() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Reveal entire section
    gsap.from(".walkthrough-header", {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    });

    // Reveal individual steps sequentially
    gsap.utils.toArray<HTMLElement>(".walkthrough-step").forEach((step, i) => {
      const isEven = i % 2 === 0;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: step,
          start: "top 75%",
          toggleActions: "play none none reverse",
        }
      });

      tl.from(step.querySelector(".step-content"), {
        x: isEven ? -40 : 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      })
        .from(step.querySelector(".step-mockup"), {
          x: isEven ? 40 : -40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.6");
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 md:py-32 px-4 sm:px-6 bg-secondary/30 border-t border-border/50">
      <div className="max-w-6xl mx-auto">

        <div className="walkthrough-header text-center max-w-3xl mx-auto mb-20 md:mb-32">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground text-balance">
            How Rynk works.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground text-balance">
            A calm space for your ideas to grow, without the pressure of organizing them.
          </p>
        </div>

        <div className="flex flex-col gap-24 md:gap-40">
          {STEPS.map((step, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={idx}
                className={cn(
                  "walkthrough-step flex flex-col gap-10 lg:gap-16 items-center",
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Text Content */}
                <div className="step-content flex-1 w-full max-w-xl">
                  <div className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide">
                    {step.title}
                  </div>
                  <h3 className="text-2xl md:text-4xl font-bold mb-4 text-foreground tracking-tight text-balance">
                    {step.heading}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* UI Mockup Content */}
                <div className="step-mockup flex-1 w-full flex justify-center perspective-[1000px]">
                  <div className={cn(
                    "w-full max-w-[500px]",
                    // Add subtle 3D rotation based on layout side
                    isEven ? "md:origin-right md:-rotate-y-6 md:hover:rotate-y-0" : "md:origin-left md:rotate-y-6 md:hover:rotate-y-0",
                    "transition-transform duration-700 ease-out"
                  )}>
                    {step.mock}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ----------------------------------------------------
// Mock Components specifically tailored for the walkthrough
// ----------------------------------------------------

function MockDumpModal() {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full flex flex-col bg-background border border-border">
      {/* Simulate Modal Header */}
      <div className="flex justify-end p-4 border-b border-border/10 fade-mask-top">
        <div className="p-2 rounded-full bg-muted/50 text-muted-foreground flex items-center gap-2 text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </div>

      {/* Simulate Modal Body - Input Area */}
      <div className="flex-1 flex flex-col p-6 lg:p-10 justify-center">
        <div className="text-xl sm:text-2xl font-light leading-relaxed tracking-tight text-foreground/90 w-full bg-transparent resize-none focus:outline-none">
          I really want to <span className="bg-primary/20 text-primary px-1 rounded">make YouTube videos</span>. But I keep telling myself I need that Sony camera first. Honestly, I think it's just a mental block about putting myself out there.
          <span className="inline-block w-[2px] h-6 bg-primary ml-1 animate-pulse align-middle" />
        </div>

        {/* Simulate Modal Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="p-3 rounded-full bg-muted/50 text-muted-foreground">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
            </div>
            <div className="p-3 rounded-full bg-muted/50 text-muted-foreground">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-muted-foreground/50 font-mono tracking-widest">
              ⌘ ENTER
            </span>
            <div className="px-6 py-3 rounded-full text-base font-medium bg-foreground text-background shadow-md">
              Submit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockThreadEvolution() {
  return (
    <div className="rounded-2xl border border-border/50 bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col relative overflow-hidden">
      {/* Top Nav Bar Simulation */}
      <div className="flex-none px-4 py-3 border-b border-border/40 bg-background/80 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-[10px] text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </div>
        <span className="text-[9px] font-mono tracking-widest text-muted-foreground/50 border border-border/40 px-2 py-1 rounded-md uppercase">
          STATE : STUCK
        </span>
      </div>

      <div className="flex-1 overflow-hidden p-4 sm:p-5 flex flex-col gap-5">
        {/* Header Section */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight mb-2 text-foreground text-balance">
            Making Videos
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            Anxious about starting the YouTube channel. Using camera equipment as an excuse to avoid putting myself out there.
          </p>
        </div>

        {/* Grounding Note (card-swiss) */}
        <div className="card-swiss p-3 rounded-xl border border-primary/20 bg-primary/5">
          <div className="swiss-label mb-1 text-primary/70 text-[10px]">Grounding Note</div>
          <p className="text-[11px] text-foreground/90 italic text-pretty">
            "You've been worrying about camera gear lately, but your video ideas are getting really good. Why not just film one on your phone?"
          </p>
        </div>

        <div className="w-full h-px bg-border/40" />

        {/* Timeline Section */}
        <div className="flex-1 flex flex-col">
          <h2 className="swiss-label text-[10px] mb-4">Timeline</h2>

          <div className="space-y-4">
            <div className="group relative">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  Today
                </div>
              </div>
              <p className="text-[12px] text-foreground/90 leading-relaxed text-pretty">
                I really want to make YouTube videos. But I keep telling myself I need that Sony camera first. Honestly, I think it's just a mental block about putting myself out there.
              </p>
            </div>

            <div className="group relative opacity-60">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  3 days ago
                </div>
              </div>
              <p className="text-[12px] text-foreground/90 leading-relaxed text-pretty">
                A video about how to organize messy notes would be fun. Maybe I do a talking head format.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
    </div>
  );
}
function MockBoardGrid() {
  const threads = [
    { title: "Making Videos", type: "Active", bg: "bg-emerald-500/10", border: "border-emerald-500/20", color: "text-emerald-500", summary: "Anxious about starting the YouTube channel. Using camera equipment as an excuse to avoid putting myself out there." },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 stack-items">
      {threads.map((t, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl p-5 md:p-6 border shadow-sm transition-all duration-300 hover:scale-[1.02]",
            "bg-card/40 text-foreground border-border/30",
            i === 0 ? "bg-card/60 border-border/60" : "opacity-80 scale-95 origin-top translate-y-[-10px] blur-[1px]",
            i === 2 ? "opacity-60 scale-90 translate-y-[-20px] blur-[2px]" : ""
          )}
          style={i > 0 ? { position: 'absolute', top: `${i * 15}px`, left: '10px', right: '10px', zIndex: -i } : undefined}
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-sm md:text-base font-medium text-foreground leading-snug">{t.title}</h3>
            <span className={cn("flex-none inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border", t.bg, t.color, t.border)}>
              {t.type}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground/80 leading-relaxed line-clamp-4">
            {t.summary}
          </p>
        </div>
      ))}
      <div className="h-28"></div>
    </div>
  );
}
