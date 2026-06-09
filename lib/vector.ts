import { HfInference } from "@huggingface/inference";

// Initialize HuggingFace client (needs an HF token in env for limits)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

// Default embedding model
export const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
export const EMBEDDING_DIMENSION = 384;

/**
 * Splits a large text into manageable chunks for vector embedding.
 * Ideal for parsing full CVs, job descriptions, or long Github readmes.
 */
export function chunkText(text: string, maxTokens: number = 200): string[] {
  // Simple token approximation (1 token ~= 4 chars)
  const maxChars = maxTokens * 4;
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  const chunks: string[] = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxChars) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = p;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + p;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  
  return chunks;
}

/**
 * Generates an embedding vector for a given text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text,
    });
    
    // HuggingFace feature extraction can return different shapes depending on the model
    // Usually it returns a 1D array or a 2D array [1, dim]
    if (Array.isArray(response) && Array.isArray(response[0])) {
      return response[0] as number[];
    }
    return response as number[];
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw new Error("Vector embedding generation failed.");
  }
}

/**
 * Searches for the most relevant career chunks based on the provided query text.
 * Uses PostgreSQL's pgvector extension via Prisma's raw query.
 */
export async function searchCareerChunks(userId: string, query: string, limit: number = 5) {
  const { prisma } = await import('@/lib/prisma');
  
  // 1. Convert the query text (e.g. Job Description) into a vector
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${embedding.join(',')}]`;

  // 2. Perform a similarity search (Cosine Distance <=> 1 - Cosine Similarity)
  // We only search chunks belonging to the specified user
  const results = await prisma.$queryRaw`
    SELECT id, content, metadata, 1 - (embedding <=> ${vectorStr}::vector) as similarity
    FROM "CareerChunk"
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit};
  `;

  return results as { id: string; content: string; metadata: string | null; similarity: number }[];
}
