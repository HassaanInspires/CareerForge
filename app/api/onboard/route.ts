import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/documentParser';
import { getProvider } from '@/lib/llm-providers';
import { CandidateMemory, defaultMemory } from '@/lib/memory';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chunkText, generateEmbedding } from '@/lib/vector';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      resumeBase64, 
      resumeFileName, 
      provider: providerName, 
      model, 
      userApiKey,
      realism = 'brutal'
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

    // Generate pgvector embeddings for resume chunks
    try {
      await prisma.careerChunk.deleteMany({
        where: { userId: user.id }
      });

      const chunks = chunkText(resumeText, 250);
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        const vectorStr = `[${embedding.join(',')}]`;
        const uuid = crypto.randomUUID();
        
        await prisma.$executeRaw`
          INSERT INTO "CareerChunk" ("id", "userId", "content", "metadata", "embedding", "createdAt")
          VALUES (
            ${uuid},
            ${user.id},
            ${chunk},
            'CV Profile',
            ${vectorStr}::vector,
            NOW()
          );
        `;
      }
    } catch (vectorErr: any) {
      console.error("Failed to generate or save vector embeddings:", vectorErr);
    }

    const provider = getProvider(providerName);

    const realismRules = realism === 'brutal'
      ? `PERSONALITY & REALISM RULE (BRUTAL REALISM):
Be brutally honest, uncompromised, and realistic. 
Assess the candidate's career level strictly based on real credentials, not inflated titles.
Identify deep deficiencies, lack of quantitative output, and true standing.`
      : `PERSONALITY & REALISM RULE (SUPPORTIVE COACHING):
Highlight strengths and frame credentials positively. Be encouraging.`;

    const prompt = `
You are the Memory Manager of an Enterprise AI Career System.
Your job is to parse a newly uploaded Master CV and initialize the candidate's permanent memory profile.

${realismRules}

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
      dataSufficiencyScore: 50, // Start at 50% for initial upload
      proofOfWork: [],
      verifiedSkills: []
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
