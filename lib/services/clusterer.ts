/**
 * Clusterer Service — Hint-Aware
 * 
 * Assigns new segments to existing idea threads or creates new ones.
 * Uses:
 * 1. Thread hints from the context-aware segmenter (title match)
 * 2. Nearest-neighbor search via Vectorize embeddings
 */

import { generateId } from "@/lib/utils";
import { findSimilarSegments } from "./embedder";

const SIMILARITY_THRESHOLD = 0.55;
const MIN_MATCHES_FOR_ASSIGNMENT = 1;

export interface ClusterResult {
    threadId: string;
    isNewThread: boolean;
    confidence: number;
}

export async function clusterSegment(
    db: any,
    vectorize: any,
    segmentId: string,
    vector: number[],
    userId: string,
    segmentText: string,
    threadHint?: string // from segmenter's existingThreadHint
): Promise<ClusterResult> {

    // Strategy 1: If segmenter gave us a thread hint, try to match by title
    if (threadHint) {
        const hintMatch = await db
            .prepare(
                `SELECT id FROM idea_threads 
         WHERE userId = ? AND title LIKE ? 
         LIMIT 1`
            )
            .bind(userId, `%${threadHint.substring(0, 30)}%`)
            .first() as any;

        if (hintMatch) {
            // Assign to the hinted thread
            await db
                .prepare(`UPDATE segments SET threadId = ?, confidence = 0.9 WHERE id = ?`)
                .bind(hintMatch.id, segmentId)
                .run();

            await db
                .prepare(
                    `UPDATE idea_threads 
           SET segmentCount = segmentCount + 1, 
               lastActivityAt = datetime('now'), 
               updatedAt = datetime('now')
           WHERE id = ?`
                )
                .bind(hintMatch.id)
                .run();

            return {
                threadId: hintMatch.id,
                isNewThread: false,
                confidence: 0.9,
            };
        }
    }

    // Strategy 2: Vector similarity search
    const similar = await findSimilarSegments(vectorize, vector, userId, 10);

    const relevantMatches = similar.filter(
        (m) => m.id !== segmentId && m.score >= SIMILARITY_THRESHOLD
    );

    if (relevantMatches.length >= MIN_MATCHES_FOR_ASSIGNMENT) {
        const threadCounts: Record<string, { count: number; totalScore: number }> = {};

        for (const match of relevantMatches) {
            const threadId = match.metadata?.threadId;
            if (!threadId) continue;

            if (!threadCounts[threadId]) {
                threadCounts[threadId] = { count: 0, totalScore: 0 };
            }
            threadCounts[threadId].count++;
            threadCounts[threadId].totalScore += match.score;
        }

        let bestThreadId: string | null = null;
        let bestAvgScore = 0;

        for (const [threadId, data] of Object.entries(threadCounts)) {
            const avgScore = data.totalScore / data.count;
            if (avgScore > bestAvgScore) {
                bestAvgScore = avgScore;
                bestThreadId = threadId;
            }
        }

        if (bestThreadId) {
            await db
                .prepare(`UPDATE segments SET threadId = ?, confidence = ? WHERE id = ?`)
                .bind(bestThreadId, bestAvgScore, segmentId)
                .run();

            await db
                .prepare(
                    `UPDATE idea_threads 
           SET segmentCount = segmentCount + 1, 
               lastActivityAt = datetime('now'), 
               updatedAt = datetime('now')
           WHERE id = ?`
                )
                .bind(bestThreadId)
                .run();

            return {
                threadId: bestThreadId,
                isNewThread: false,
                confidence: bestAvgScore,
            };
        }
    }

    // Strategy 3: No match — create a new thread
    const newThreadId = generateId();

    const initialTitle = segmentText.length > 80
        ? segmentText.substring(0, 77) + "..."
        : segmentText;

    await db
        .prepare(
            `INSERT INTO idea_threads (id, userId, title, state, segmentCount, lastActivityAt, createdAt, updatedAt)
       VALUES (?, ?, ?, 'seed', 1, datetime('now'), datetime('now'), datetime('now'))`
        )
        .bind(newThreadId, userId, initialTitle)
        .run();

    await db
        .prepare(`UPDATE segments SET threadId = ?, confidence = 1.0 WHERE id = ?`)
        .bind(newThreadId, segmentId)
        .run();

    return {
        threadId: newThreadId,
        isNewThread: true,
        confidence: 1.0,
    };
}
