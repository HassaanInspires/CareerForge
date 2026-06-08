import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/documentParser';
import { getProvider } from '@/lib/llm-providers';
import { CandidateMemory, defaultMemory } from '@/lib/memory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      resumeBase64, 
      resumeFileName, 
      provider: providerName, 
      model, 
      userApiKey 
    } = body;

    if (!resumeBase64 || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decode Resume
    let resumeText = '';
    try {
      const buffer = Buffer.from(resumeBase64, 'base64');
      const uint8Array = new Uint8Array(buffer);
      resumeText = await extractTextFromFile(uint8Array, resumeFileName || 'resume.pdf');
    } catch (err: any) {
      return NextResponse.json({ error: `File Parsing Error: ${err.message}` }, { status: 422 });
    }

    const provider = getProvider(providerName);

    const prompt = `
You are the Memory Manager of an Enterprise AI Career System.
Your job is to parse a newly uploaded Master CV and initialize the candidate's permanent memory profile.

CRITICAL GUARDRAILS:
1. ONLY extract hard skills, numbers, tools, and direct business impact.
2. IGNORE fluff, opinions, or AI buzzwords.
3. Infer the candidate's career level based on their years of experience and titles (e.g., "Entry Level", "Mid Level", "Senior", "Executive").

--- MASTER CV TEXT ---
${resumeText.substring(0, 5000)}...

Return ONLY a valid JSON object matching this exact structure:
{
  "coreSkills": ["skill1", "skill2"],
  "verifiableMetrics": ["increased sales by 20%", "managed team of 5"],
  "careerGoals": "Extracted or inferred career goals",
  "identifiedGaps": [],
  "careerLevel": "Senior",
  "dataSufficiencyScore": 50
}
`;

    const rawResponse = await provider.callAPI(prompt, userApiKey || '', model);
    
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const newMemory = JSON.parse(jsonString) as CandidateMemory;
    
    const memory: CandidateMemory = {
      coreSkills: newMemory.coreSkills || [],
      verifiableMetrics: newMemory.verifiableMetrics || [],
      careerGoals: newMemory.careerGoals || '',
      identifiedGaps: [],
      careerLevel: newMemory.careerLevel || 'Entry Level',
      dataSufficiencyScore: 50 // Start at 50% for initial upload
    };

    return NextResponse.json({ memory });

  } catch (error: any) {
    console.error('Onboard Engine Error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
