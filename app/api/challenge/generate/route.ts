import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm-providers';
import { Provider } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    let { targetSkill, roleContext, provider: providerName, model, userApiKey } = body;

    // Load configurations from Database settings if missing
    let dbKeys: Record<string, string> = {};
    let dbModels: Record<string, string> = {};
    if (user.apiKeys) {
      try { dbKeys = JSON.parse(user.apiKeys); } catch (e) {}
    }
    if (user.selectedModels) {
      try { dbModels = JSON.parse(user.selectedModels); } catch (e) {}
    }

    if (!providerName) {
      providerName = user.activeProvider || 'anthropic';
    }
    if (!model) {
      model = dbModels[providerName] || '';
    }
    if (!userApiKey) {
      userApiKey = dbKeys[providerName] || '';
    }

    if (!targetSkill || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const provider = getProvider(providerName);

    const prompt = `
You are an expert Technical Interviewer.
Your goal is to generate a short, real-world "Proof of Work" micro-assessment for a candidate.
Target Skill to Verify: ${targetSkill}
Target Role Context: ${roleContext || 'General Professional'}

INSTRUCTIONS:
1. Create a practical, 10-15 minute task that proves the candidate has this skill.
2. If it's a coding skill (e.g. React), ask them to write a small component or fix a bug.
3. If it's a creative/marketing skill, ask them to write a short copy snippet or outline a strategy.
4. Output the challenge strictly as a JSON object with this exact structure:
{
  "title": "Short title of the challenge",
  "description": "The detailed scenario and instructions.",
  "expectedFormat": "What they need to write (e.g. 'A code snippet', 'A paragraph')",
  "evaluationCriteria": ["Criterion 1", "Criterion 2"]
}
`;

    const rawResponse = await provider.callAPI(prompt, userApiKey, model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const challengeData = JSON.parse(jsonString);

    return NextResponse.json({ challenge: challengeData });
  } catch (error: any) {
    console.error('Challenge Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
