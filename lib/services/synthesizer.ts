/**
 * Synthesizer Service — Context-Aware
 * 
 * Given a thread's segments + temporal context, uses Groq API to generate:
 * - title, summary, state, stateReason
 * - realityScore, groundingNote
 * - momentum (computed from dump frequency)
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "moonshotai/kimi-k2-instruct-0905";

export interface SynthesisResult {
    title: string;
    summary: string;
    state: "seed" | "active" | "stuck" | "deciding" | "parked" | "done";
    stateReason: string;
    realityScore: number;
    groundingNote: string;
    momentum: "rising" | "steady" | "declining" | "stale";
}

export interface TemporalContext {
    totalDumps: number;          // how many dumps mention this thread
    firstMentioned: string;      // ISO date
    lastMentioned: string;       // ISO date
    daysSinceLastMention: number;
    recentDumpCount: number;     // dumps in last 7 days
    olderDumpCount: number;      // dumps before last 7 days
}

function buildSynthesisPrompt(temporal: TemporalContext | null): string {
    const temporalSection = temporal
        ? `
TEMPORAL CONTEXT (use this to assess state and momentum):
- Total dumps mentioning this thread: ${temporal.totalDumps}
- First mentioned: ${temporal.firstMentioned}
- Last mentioned: ${temporal.lastMentioned}
- Days since last mention: ${temporal.daysSinceLastMention}
- Dumps in last 7 days: ${temporal.recentDumpCount}
- Dumps before last 7 days: ${temporal.olderDumpCount}`
        : "";

    return `You are an AI thinking partner analyzing a user's idea thread. Based on the thought segments and temporal context below, generate a synthesis.

${temporalSection}

Rules:
- Title: 3-8 words, captures the core idea
- Summary: 1-2 sentences describing what this idea is about
- State: Choose based on BOTH segment content AND temporal patterns:
  - "seed" = Early idea, only 1-2 mentions, still forming
  - "active" = Being actively developed, frequent recent mentions, forward progress
  - "stuck" = User mentions frustration, obstacles, or keeps circling without progress
  - "deciding" = Comparing options, weighing trade-offs, mentions "should I" / "or maybe"
  - "parked" = No recent mentions (7+ days), user moved on
  - "done" = User declares completion or signals resolution
- State Reason: One sentence explaining your state choice, referencing temporal evidence
- Reality Score: 1-10 feasibility based on specificity and actionability
- Grounding Note: A brief observation like a thoughtful friend who's been paying attention. 
  Reference specific patterns you notice: time gaps, scope changes, mood shifts, avoidance.
  Examples: "You've mentioned this in 3 dumps over 2 weeks but haven't taken any concrete steps yet."
  "The scope has grown from 'simple directory' to 'full marketplace' — might be worth scoping back."
  Be GENTLE but HONEST. Never preachy or coach-like.
- Momentum: Based on temporal patterns:
  - "rising" = More dumps recently than before
  - "steady" = Consistent mention frequency
  - "declining" = Fewer recent dumps than before
  - "stale" = No mentions for 14+ days

Return ONLY valid JSON with fields: title, summary, state, stateReason, realityScore, groundingNote, momentum`;
}

export async function synthesizeThread(
    ai: any,
    segments: Array<{ text: string; type: string; createdAt: string }>,
    temporal: TemporalContext | null = null
): Promise<SynthesisResult> {
    const segmentText = segments
        .map((s) => `[${s.createdAt}] (${s.type}) ${s.text}`)
        .join("\n\n");

    // Compute momentum from temporal context if available
    const computedMomentum = computeMomentum(temporal);

    try {
        const prompt = buildSynthesisPrompt(temporal);
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error("GROQ_API_KEY not configured");

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: prompt },
                    { role: "user", content: `Here are all segments for this idea thread:\n\n${segmentText}` },
                ],
                max_tokens: 1024,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: "Unknown error" } })) as any;
            throw new Error(`Groq API error: ${error.error?.message || response.status}`);
        }

        const data = await response.json() as any;
        const text = data.choices?.[0]?.message?.content || "";
        console.log("[Synthesizer] Groq response:", text.substring(0, 300));
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                title: result.title || "Untitled Idea",
                summary: result.summary || "",
                state: result.state || "seed",
                stateReason: result.stateReason || "",
                realityScore: Math.min(10, Math.max(1, parseInt(result.realityScore) || 5)),
                groundingNote: result.groundingNote || "",
                momentum: result.momentum || computedMomentum,
            };
        }
    } catch (error) {
        console.error("Synthesis failed:", error);
    }

    // Fallback
    return {
        title: segments[0]?.text.substring(0, 60) + "..." || "Untitled",
        summary: "AI synthesis pending...",
        state: "seed",
        stateReason: "New thread, not enough data yet",
        realityScore: 5,
        groundingNote: "",
        momentum: computedMomentum,
    };
}

/**
 * Compute momentum from temporal data as a fallback/validation
 */
function computeMomentum(temporal: TemporalContext | null): "rising" | "steady" | "declining" | "stale" {
    if (!temporal) return "steady";

    if (temporal.daysSinceLastMention >= 14) return "stale";
    if (temporal.recentDumpCount > temporal.olderDumpCount) return "rising";
    if (temporal.recentDumpCount < temporal.olderDumpCount && temporal.olderDumpCount > 0) return "declining";
    return "steady";
}
