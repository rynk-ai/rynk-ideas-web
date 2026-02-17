/**
 * Embedder Service
 * 
 * Generates vector embeddings for segments using Workers AI bge-base-en-v1.5
 * and stores them in Vectorize for semantic search and clustering.
 */

export interface EmbeddingResult {
    segmentId: string;
    vector: number[];
}

export async function embedSegment(
    ai: any,
    text: string
): Promise<number[]> {
    const response = await ai.run("@cf/baai/bge-base-en-v1.5", {
        text: [text],
    });

    return response.data[0];
}

export async function storeEmbedding(
    vectorize: any,
    segmentId: string,
    vector: number[],
    metadata: {
        userId: string;
        threadId?: string;
        segmentType: string;
        text: string;
    }
): Promise<void> {
    await vectorize.upsert([
        {
            id: segmentId,
            values: vector,
            metadata: {
                ...metadata,
                product: "rynk-ideas",
                text: metadata.text.substring(0, 200),
            },
        },
    ]);
}

export async function findSimilarSegments(
    vectorize: any,
    vector: number[],
    userId: string,
    topK: number = 10
): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const results = await vectorize.query(vector, {
        topK,
        filter: {
            userId,
            product: "rynk-ideas",
        },
        returnMetadata: "all",
    });

    return results.matches || [];
}
