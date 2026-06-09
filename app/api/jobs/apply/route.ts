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
      userApiKey,
      interviewAnswers = []
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

    const resolvedLLM = resolveActiveLLM(
      dbKeys,
      dbModels,
      providerName || user.activeProvider || 'anthropic',
      model || ''
    );
    providerName = resolvedLLM.provider;
    model = resolvedLLM.model;
    userApiKey = resolvedLLM.apiKey;

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
    const userName = user.name || 'Candidate';
    const userEmail = user.email || '';

    // Format the interview responses
    let answersContext = '';
    if (interviewAnswers && Array.isArray(interviewAnswers) && interviewAnswers.length > 0) {
      answersContext = `\n--- CANDIDATE TARGETED INTERVIEW RESPONSES ---\n` + 
        interviewAnswers.map((ans: any, idx: number) => 
          `Q${idx + 1}: ${ans.question}\nResponse: ${ans.answer}`
        ).join('\n\n') + '\n';
    }

    const provider = getProvider(providerName);
    const prompt = `
You are the AI Application Strategy & Cover Letter Generator for CareerForge.
Your job is to draft an exceptional application strategy for a candidate applying to a specific role.
The proposal must be authentic, highly professional, completely customized to their actual credentials, and completely free of generic AI fluff.

--- CANDIDATE PROFILE ---
Name: ${userName}
Email: ${userEmail}
Career Level: ${careerLevel}
Core Skills: ${coreSkills.join(', ')}
Verifiable Metrics:
${verifiableMetrics.map(m => `- ${m}`).join('\n')}

--- PROOF OF WORK ARTIFACTS IN PORTFOLIO ---
${powTitles || 'No artifacts registered.'}
${answersContext}
--- TARGET JOB DETAILS ---
Title: ${title}
Company: ${company}
Salary: ${salary || 'Not specified'}
URL: ${url}
Description: ${description || 'Not specified'}

Formulate:
1. A tailored proposal / cover letter (max 350 words) that matches their metrics, proof-of-work, and specific interview responses to the job spec. Integrate their interview answers naturally.
   - IMPORTANT: You MUST write the proposal using the candidate's actual name: ${userName} at the signoff. Never use placeholders like '[Your Name]', '[Candidate Name]', or '[Insert Name]'.
2. A unique Value Proposition Hook (1-sentence) that sets this candidate apart for this specific job role.
3. A customized salary justification strategy showing how to argue for maximum pay based on their metrics.
4. A checklist of exactly what attachments to include (e.g. specific GitHub repos, certified CV).
5. A skills preparation list detailing exactly what topics from the job description they should study to succeed in the interview.
6. A step-by-step customization guide on how to update/modify their resume/portfolio specifically to stand out for this role.
7. A follow-up sequence timeline (e.g., Day 3, Day 7, Day 14) showing how and when they should follow up.

Return ONLY a valid JSON object matching this exact structure:
{
  "proposal": "The customized pitch / cover letter text signed off with ${userName}...",
  "valueHook": "The unique positioning hook sentence...",
  "requiredAttachments": ["Attachment 1 description", "Attachment 2 description"],
  "salaryNegotiation": "Salary negotiation recommendation text...",
  "checklist": ["Interview prep item 1", "Interview prep item 2"],
  "customizationGuide": "Detailed advice on how to tweak their portfolio and resume for this specific position...",
  "followUpTimeline": [
    "Day 3: Actionable follow up item...",
    "Day 7: Actionable follow up item...",
    "Day 14: Actionable follow up item..."
  ]
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
