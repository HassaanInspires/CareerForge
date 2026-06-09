import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider, resolveActiveLLM } from '@/lib/llm-providers';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { memory: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Load provider config
    let dbKeys: Record<string, string> = {};
    let dbModels: Record<string, string> = {};
    if (user.apiKeys) {
      try { dbKeys = JSON.parse(user.apiKeys); } catch (e) {}
    }
    if (user.selectedModels) {
      try { dbModels = JSON.parse(user.selectedModels); } catch (e) {}
    }

    const resolvedLLM = resolveActiveLLM(
      dbKeys,
      dbModels,
      user.activeProvider || 'anthropic',
      ''
    );

    if (!resolvedLLM.provider || !resolvedLLM.model || !resolvedLLM.apiKey) {
      return NextResponse.json({ error: 'No active LLM provider configured with API Key.' }, { status: 400 });
    }

    let coreSkills: string[] = [];
    let careerGoals = 'Not set';
    let careerLevel = 'Unknown';

    if (user.memory) {
      try { coreSkills = JSON.parse(user.memory.coreSkills); } catch (e) {}
      careerGoals = user.memory.careerGoals || 'Not set';
      careerLevel = user.memory.careerLevel || 'Unknown';
    }

    const provider = getProvider(resolvedLLM.provider);
    const prompt = `
You are the CareerForge AI Agent. Your task is to analyze the candidate's profile data (skills, goals, career level) and formulate an optimized job search query.
This query will be used to crawl job boards (like LinkedIn or Upwork). It should be targeted, concise, and match their skills.

--- CANDIDATE DETAILS ---
Career Level: ${careerLevel}
Core Skills: ${coreSkills.join(', ')}
Career Goals: ${careerGoals}

Formulate:
1. An optimized "query" keyword string (max 3-4 keywords, comma-separated or simple text, e.g., "React Developer", "Python Engineer").
2. A location preferential recommendation (e.g., "Remote", "Europe", "US").
3. A 2-sentence "rationale" explaining why this query fits their profile.

Return ONLY a valid JSON object matching this exact structure:
{
  "query": "React Next.js Developer",
  "location": "Remote",
  "rationale": "Since you have strong experience with React and Next.js and aim for senior full-stack roles, this search targets high-value modern web development opportunities."
}
`;

    const rawResponse = await provider.callAPI(prompt, resolvedLLM.apiKey, resolvedLLM.model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const result = JSON.parse(jsonString);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Suggest query API error:', error);
    return NextResponse.json(
      { error: `Failed to suggest query: ${error.message}` },
      { status: 500 }
    );
  }
}
