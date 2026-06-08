import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/documentParser';
import { getProvider } from '@/lib/llm-providers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeBase64, resumeFileName, jobDescription, provider: providerName, model, userApiKey } = body;

    if (!resumeBase64 || !jobDescription || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    const prompt = `You are an expert career coach. Analyze the following resume and job description. 
Generate exactly 3 to 5 specific, insightful questions to ask the candidate to understand their profile better, clarify gaps, or highlight hidden achievements relevant to this job description.
Return ONLY a valid JSON array of strings, like this: ["Question 1?", "Question 2?", "Question 3?"]

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;

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

    // 5. Parse JSON Response
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
      const questions = JSON.parse(jsonString) as string[];

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid format returned by AI');
      }

      return NextResponse.json({ questions });
    } catch (err: any) {
      console.error('JSON Parsing Error:', err, 'Raw Response:', rawResponse);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Generate Questions API Global Error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
