import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProvider } from '@/lib/llm-providers';
import { generatePrompt } from '@/lib/utils';
import { OptimizeRequest, OptimizeResponse } from '@/lib/types';
import { searchCareerChunks } from '@/lib/vector';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as OptimizeRequest;
    
    const {
      jobDescription,
      provider: providerName,
      model,
      userApiKey,
      memory,
      preferences = { tone: 'brutal', length: 'standard', focus: 'proof' },
      realism = 'brutal',
    } = body;

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    if (!providerName || !model) {
      return NextResponse.json({ error: 'LLM provider and model are required' }, { status: 400 });
    }

    // 1. RAG Vector Search: Get the most relevant career chunks
    let ragContext = '';
    try {
      const relevantChunks = await searchCareerChunks((session.user as any).id, jobDescription, 5);
      ragContext = relevantChunks.map(c => `[Context from ${c.metadata || 'Profile'}]:\n${c.content}`).join('\n\n');
    } catch (err: any) {
      console.warn("RAG Search skipped or failed:", err.message);
      // Fallback: If vector search fails, just use the raw memory object
      ragContext = "No vector memory available. Relying on baseline profile stats.";
    }

    // 2. Initialize Provider
    const provider = getProvider(providerName);
    
    // 3. Generate Prompt (Pass RAG Context instead of full ResumeText)
    const prompt = generatePrompt(ragContext, jobDescription, memory, preferences, realism);

    // 4. Call LLM API
    let rawResponse = '';
    try {
      rawResponse = await provider.callAPI(prompt, userApiKey || '', model);
    } catch (err: any) {
      console.error('LLM API Error:', err);
      return NextResponse.json(
        { error: `LLM Provider Error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    // 5. Parse JSON Response from LLM
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
      const parsedResult = JSON.parse(jsonString) as OptimizeResponse;

      return NextResponse.json(parsedResult);
    } catch (err: any) {
      console.error('JSON Parsing Error:', err, 'Raw Response:', rawResponse);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Optimization API Global Error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
