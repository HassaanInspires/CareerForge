import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/llm-providers';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { memory: true, proofOfWork: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    let {
      title,
      company,
      url,
      description,
      salary,
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

    if (!title || !company || !providerName || !model) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Load user memory
    let coreSkills: string[] = [];
    let verifiableMetrics: string[] = [];
    let careerLevel = 'Unknown';
    if (user.memory) {
      try { coreSkills = JSON.parse(user.memory.coreSkills); } catch (e) {}
      try { verifiableMetrics = JSON.parse(user.memory.verifiableMetrics); } catch (e) {}
      careerLevel = user.memory.careerLevel || 'Unknown';
    }

    const powTitles = user.proofOfWork.map(p => `- ${p.title} (${p.type}): ${p.url}`).join('\n');

    const provider = getProvider(providerName);
    const prompt = `
You are the AI Application Strategy & Cover Letter Generator for CareerForge.
Your job is to draft an exceptional application strategy for a candidate applying to a specific role.
The proposal must be authentic, highly professional, completely customized to their actual credentials, and completely free of generic AI fluff.

--- CANDIDATE PROFILE ---
Career Level: ${careerLevel}
Core Skills: ${coreSkills.join(', ')}
Verifiable Metrics:
${verifiableMetrics.map(m => `- ${m}`).join('\n')}

--- PROOF OF WORK ARTIFACTS IN PORTFOLIO ---
${powTitles || 'No artifacts registered.'}

--- TARGET JOB DETAILS ---
Title: ${title}
Company: ${company}
Salary: ${salary || 'Not specified'}
URL: ${url}
Description: ${description || 'Not specified'}

Formulate:
1. A tailored proposal / cover letter (max 350 words) that matches their metrics and proof-of-work to the job spec.
2. A checklist of exactly what attachments to include (e.g. specific GitHub repos, certified CV).
3. A customized salary justification strategy showing how to argue for maximum pay based on their metrics.
4. A skills preparation list detailing exactly what topics from the job description they should study to succeed in the interview.

Return ONLY a valid JSON object matching this exact structure:
{
  "proposal": "The customized pitch / cover letter text...",
  "requiredAttachments": ["Attachment 1 description", "Attachment 2 description"],
  "salaryNegotiation": "Salary negotiation recommendation text...",
  "checklist": ["Interview prep item 1", "Interview prep item 2"]
}
`;

    const rawResponse = await provider.callAPI(prompt, userApiKey || '', model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const result = JSON.parse(jsonString);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Job Apply Engine Error:', error);
    return NextResponse.json(
      { error: `Failed to compile application strategy: ${error.message}` },
      { status: 500 }
    );
  }
}
