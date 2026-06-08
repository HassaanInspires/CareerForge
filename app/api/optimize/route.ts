import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/documentParser';
import { getProvider } from '@/lib/llm-providers';
import { generatePrompt } from '@/lib/utils';
import { OptimizeRequest, OptimizeResponse } from '@/lib/types';
import { defaultMemory } from '@/lib/memory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as OptimizeRequest;
    
    const {
      resumeBase64,
      resumeFileName,
      jobDescription,
      provider: providerName,
      model,
      userApiKey,
      memory,
      preferences = {
        tone: 'professional',
        length: 'standard',
        focus: 'skills',
      },
    } = body;

    // Input Validation
    if (!resumeBase64) {
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 });
    }
    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }
    if (!providerName || !model) {
      return NextResponse.json({ error: 'LLM provider and model are required' }, { status: 400 });
    }

    // 1. Decode and Parse Document
    let resumeText = '';
    try {
      const buffer = Buffer.from(resumeBase64, 'base64');
      const uint8Array = new Uint8Array(buffer);
      resumeText = await extractTextFromFile(uint8Array, resumeFileName || 'resume.pdf');
    } catch (err: any) {
      console.error('File Parsing Error:', err);
      return NextResponse.json({ error: `File Parsing Error: ${err.message}` }, { status: 422 });
    }

    // 2. Initialize Provider
    const provider = getProvider(providerName);
    
    // 3. Generate Prompt
    const prompt = generatePrompt(resumeText, jobDescription, memory || defaultMemory, preferences);

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
