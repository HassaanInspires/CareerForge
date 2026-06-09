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
    let { challenge, submission, targetSkill, provider: providerName, model, userApiKey } = body;

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

    if (!challenge || !submission || !targetSkill || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const provider = getProvider(providerName);

    const prompt = `
You are an expert Technical Reviewer.
Your goal is to evaluate the candidate's submission to a micro-assessment and determine if they have successfully proven their proficiency in the target skill.

Target Skill: ${targetSkill}

--- CHALLENGE ---
Title: ${challenge.title}
Description: ${challenge.description}
Evaluation Criteria: ${challenge.evaluationCriteria.join(', ')}

--- CANDIDATE SUBMISSION ---
${submission}

INSTRUCTIONS:
1. Honestly evaluate the submission against the criteria.
2. Determine if the candidate PASSES or FAILS. (Pass means they demonstrated real competence, not just AI-generated fluff).
3. Provide constructive feedback.
4. Output the evaluation strictly as a JSON object with this exact structure:
{
  "passed": true,
  "score": 85,
  "feedback": "Your code correctly implemented the hook, but missed error handling...",
  "verifiedMetrics": {
    "skill": "${targetSkill}",
    "competency_level": "Intermediate",
    "strength": "Clean logic"
  }
}
`;

    const rawResponse = await provider.callAPI(prompt, userApiKey, model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const evaluationData = JSON.parse(jsonString);

    return NextResponse.json({ evaluation: evaluationData });
  } catch (error: any) {
    console.error('Challenge Evaluation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate challenge' },
      { status: 500 }
    );
  }
}
