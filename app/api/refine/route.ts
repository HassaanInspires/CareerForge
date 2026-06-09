import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm-providers';
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
    let { 
      currentResume, 
      userInstruction, 
      provider: providerName, 
      model, 
      userApiKey 
    } = body;

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

    if (!currentResume || !userInstruction || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const provider = getProvider(providerName);

    const prompt = `
You are an elite Executive Resume Editor. 
Your job is to apply a user's instruction to an existing resume draft.

--- EXISTING RESUME DRAFT ---
${currentResume}

--- USER INSTRUCTION ---
${userInstruction}

RULES:
1. Apply the user's instructions exactly as requested.
2. Do not invent new jobs or metrics unless the user explicitly provided them in the instruction.
3. Keep the overall markdown formatting clean and professional.
4. ONLY return a JSON object with the refined text. Do not return conversational filler.

Return exactly this JSON format:
{
  "refinedResume": "The full text of the newly edited resume in Markdown..."
}
`;

    const rawResponse = await provider.callAPI(prompt, userApiKey || '', model);
    
    let refinedResume = currentResume;
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
      const parsed = JSON.parse(jsonString);
      if (parsed.refinedResume) {
        refinedResume = parsed.refinedResume;
      }
    } catch (e) {
      // Fallback if the LLM didn't return JSON
      refinedResume = rawResponse.replace(/```json/g, '').replace(/```/g, '');
    }

    return NextResponse.json({ refinedResume });

  } catch (error: any) {
    console.error('Refinement Engine Error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
