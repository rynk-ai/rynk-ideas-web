/**
 * Segmenter Service — Context-Aware
 * 
 * Takes raw dump text + existing thread context and uses Groq API (LLM)
 * to split it into semantic segments, aware of the user's ongoing threads.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "moonshotai/kimi-k2-instruct-0905";

export interface Segment {
    text: string;
    type: "thought" | "action_item" | "idea" | "emotion" | "comparison" | "question";
    existingThreadHint?: string; // thread title if AI thinks this continues an existing thread
}

export interface ThreadContext {
    id: string;
    title: string;
    summary: string | null;
    state: string;
    segmentCount: number;
}

function buildSegmentationPrompt(existingThreads: ThreadContext[]): string {
    const threadList = existingThreads.length > 0
        ? existingThreads.map((t) => `- "${t.title}" (${t.state}, ${t.segmentCount} segments)${t.summary ? `: ${t.summary}` : ""}`).join("\n")
        : "(No existing threads yet — this is the user's first dump)";

    return `You segment freewriting into topic-level groups for a personal idea tracker.

EXISTING THREADS:
${threadList}

INSTRUCTIONS — follow this two-step process:

STEP 1: Read the entire dump. Identify the DISTINCT TOPICS (themes). A topic is a subject the user is thinking about — NOT a single sentence. Most dumps have 1-3 topics, rarely 4.

STEP 2: For each topic, collect ALL text from the dump that belongs to that topic — even if sentences are scattered across the dump. Merge them into one segment, preserving original wording.

CRITICAL RULES:
- Maximum 4 segments. If you find more than 4 topics, merge the closest ones.
- Each segment must be at least 2 sentences. Never create a segment from a single sentence.
- Emotions, frustrations, and reflections about a topic belong WITH that topic, not as separate segments.
- If text continues an EXISTING thread above, set "existingThreadHint" to the EXACT thread title.
- Types: "idea", "action_item", "thought", "question", "emotion", "comparison"

EXAMPLE:
Input: "I keep going back and forth on the pricing model. Should it be freemium or paid-only? I'm so frustrated with this decision. Also talked to Sarah about the mobile app — she thinks React Native is the way to go. Need to research that more. The pricing thing is killing me, maybe I should just launch free and see what happens."

Topics identified: (1) Pricing decision, (2) Mobile app tech choice

Output:
[
  {"text": "I keep going back and forth on the pricing model. Should it be freemium or paid-only? I'm so frustrated with this decision. The pricing thing is killing me, maybe I should just launch free and see what happens.", "type": "comparison"},
  {"text": "Also talked to Sarah about the mobile app — she thinks React Native is the way to go. Need to research that more.", "type": "idea"}
]

Notice: the frustration about pricing is merged INTO the pricing segment, not separate. Scattered pricing sentences are merged together.

Return ONLY a JSON array:
[{"text": "merged text...", "type": "idea", "existingThreadHint": "Title If Exists"}]`;
}

export async function segmentDump(
    ai: any,
    dumpContent: string,
    existingThreads: ThreadContext[] = []
): Promise<Segment[]> {
    try {
        const prompt = buildSegmentationPrompt(existingThreads);
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
                    { role: "user", content: dumpContent },
                ],
                max_tokens: 2048,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: "Unknown error" } })) as any;
            throw new Error(`Groq API error: ${error.error?.message || response.status}`);
        }

        const data = await response.json() as any;
        const text = data.choices?.[0]?.message?.content || "";
        console.log("[Segmenter] Groq response:", text.substring(0, 300));

        // Extract JSON array from response (handle markdown code blocks, extra text)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return [{ text: dumpContent, type: "thought" }];
        }

        const segments: Segment[] = JSON.parse(jsonMatch[0]);

        // Validate segments
        const valid = segments.filter(
            (s) => s.text?.trim() && s.type && s.text.trim().length > 15
        ).map((s) => ({
            text: s.text.trim(),
            type: s.type,
            existingThreadHint: s.existingThreadHint?.trim() || undefined,
        }));

        // Safety: if LLM produced too many segments, fall back to paragraphs
        if (valid.length > 6) {
            console.warn(`Segmenter produced ${valid.length} segments, falling back to paragraph splitting`);
            return paragraphFallback(dumpContent);
        }

        return valid.length > 0 ? valid : [{ text: dumpContent, type: "thought" }];
    } catch (error) {
        console.error("Segmentation failed, using fallback:", error);
        return paragraphFallback(dumpContent);
    }
}

function paragraphFallback(content: string): Segment[] {
    const paragraphs = content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 20);

    if (paragraphs.length === 0) {
        return [{ text: content.trim(), type: "thought" }];
    }

    return paragraphs.map((p) => ({ text: p, type: "thought" as const }));
}
