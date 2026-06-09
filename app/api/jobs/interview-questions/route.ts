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

    const body = await req.json();
    const { title, company, description } = body;

    if (!title || !company) {
      return NextResponse.json({ error: 'Job Title and Company are required' }, { status: 400 });
    }

    // Load LLM provider config
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
    if (user.memory) {
      try { coreSkills = JSON.parse(user.memory.coreSkills); } catch (e) {}
    }

    const provider = getProvider(resolvedLLM.provider);
    const prompt = `
You are the CareerForge AI Interviewer. The candidate wants to apply for this job:
Title: ${title}
Company: ${company}
Description: ${description || 'Not specified'}

Candidate Core Skills: ${coreSkills.join(', ')}

Analyze the job description and compare it to the candidate's skills. Generate exactly 3 highly customized interview questions that will help the AI write a significantly better, hyper-tailored cover letter for them.

The questions MUST match this structure:
- Question 1: A Multiple Choice Question (MCQ) asking about their experience or comfort level with a specific key technology or domain in the job description. Provide 3-4 options.
- Question 2: A Select-Multiple or Yes/No question asking about specific certifications, availability, or preferences related to this role. Provide 2-4 options.
- Question 3: A Short-Answer question prompting the user to summarize a specific past project or achievement relevant to this role (1-line answer).

Return ONLY a valid JSON object matching this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "What is your primary experience level with React server components?",
      "options": ["No experience yet", "1-2 years of side projects", "3+ years in production settings"]
    },
    {
      "id": "q2",
      "type": "multi",
      "question": "Which of the following aspects of this job are you most confident in? (Select all that apply)",
      "options": ["Next.js App Router", "Tailwind CSS styling", "Prisma Database ORM"]
    },
    {
      "id": "q3",
      "type": "text",
      "question": "Briefly describe one system-design or web application project you have shipped using these technologies:"
    }
  ]
}
`;

    const rawResponse = await provider.callAPI(prompt, resolvedLLM.apiKey, resolvedLLM.model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const result = JSON.parse(jsonString);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Interview questions API error:', error);
    return NextResponse.json(
      { error: `Failed to generate interview questions: ${error.message}` },
      { status: 500 }
    );
  }
}
