import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/llm-providers';
import { updateMemory, CandidateMemory, defaultMemory } from '@/lib/memory';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchCareerChunks } from '@/lib/vector';
import { prisma } from '@/lib/prisma';

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
    let { 
      messages, 
      jobDescription, 
      memory, 
      provider: providerName, 
      model, 
      userApiKey,
      realism
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
    if (!realism) {
      realism = user.aiRealism || 'brutal';
    }

    if (!jobDescription || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch relevant career chunks using RAG semantic search
    let resumeText = '';
    try {
      const user = session.user as any;
      const lastUserMsg = messages.length > 0 ? messages[messages.length - 1].content : '';
      if (user.id && lastUserMsg) {
        const chunks = await searchCareerChunks(user.id, lastUserMsg, 4);
        resumeText = chunks.map(c => c.content).join('\n\n');
      }
    } catch (ragErr: any) {
      console.warn("RAG fetch failed inside chat route:", ragErr.message);
    }

    const provider = getProvider(providerName);
    let currentMemory: CandidateMemory = memory || defaultMemory;

    // 2. Update Memory if user just replied
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMsg = messages[messages.length - 1].content;
      currentMemory = await updateMemory(currentMemory, lastUserMsg, jobDescription, providerName, model, userApiKey, realism);
    }

    // 3. Check if we have enough data to skip asking more questions
    // If score > 85, we can end the chat and move to optimization
    if (currentMemory.dataSufficiencyScore >= 85) {
      return NextResponse.json({ 
        response: "[READY_TO_OPTIMIZE] I have enough data to build a world-class resume. Click the button below to proceed to generation.", 
        memory: currentMemory,
        isFinished: true
      });
    }

    // 4. Generate the next question based on Memory and Context
    // Format chat history for prompt
    const chatHistoryStr = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const realismRules = realism === 'brutal'
      ? `Be brutally honest, uncompromised, and realistic. Call out gaps immediately, point out weaknesses in their answer, and demand metrics. Show them exactly what standing they hold.`
      : `Be encouraging and supportive. Highlight positive strengths while gently inquiring about quantitative details.`;

    const prompt = `
You are an elite, highly critical Executive Career Coach.
Your goal is to extract strictly verifiable, quantitative metrics and specific technical skills from the user to map their Resume to the Job Description.

PERSONALITY RULE:
${realismRules}

--- CURRENT MEMORY PROFILE ---
Skills: ${currentMemory.coreSkills.join(', ')}
Metrics: ${currentMemory.verifiableMetrics.join(', ')}
Gaps Identified: ${currentMemory.identifiedGaps.join(', ')}
Data Sufficiency Score: ${currentMemory.dataSufficiencyScore}/100
 
--- RESUME TEXT ---
${resumeText.substring(0, 2000)}...
 
--- JOB DESCRIPTION ---
${jobDescription.substring(0, 2000)}...
 
--- RECENT CHAT HISTORY ---
${chatHistoryStr}
 
INSTRUCTIONS & STRICT GUARDRAILS:
1. DO NOT answer general questions (e.g., "What is the capital of France?"). Reply: "I am strictly focused on extracting your career data. Please answer my previous question."
2. DO NOT ask multiple questions at once. Ask EXACTLY ONE highly specific, targeted question.
3. If the user gives a vague answer (e.g., "I managed a team"), push back and demand numbers ("How many people? What was the budget?").
4. If the Data Sufficiency Score is low, focus on filling the 'Gaps Identified'.
5. Keep your tone professional, concise, and direct. No fluff. No "Great job!".
6. Use <thought> tags to think step-by-step about what is missing before you ask the question, but ONLY output the final question outside the tags.

Example format:
<thought>
The user hasn't provided metrics for their cloud migration project. The JD requires AWS experience. I need to ask about the scale of the migration.
</thought>
Can you quantify the scale of your AWS migration? How many servers were moved, and what was the percentage reduction in downtime?
`;

    const rawResponse = await provider.callAPI(prompt, userApiKey || '', model);
    
    // Extract everything outside of <thought> tags
    const finalResponse = rawResponse.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
    
    // Fallback if formatting failed
    const responseText = finalResponse || rawResponse;

    return NextResponse.json({ 
      response: responseText, 
      memory: currentMemory,
      isFinished: false
    });

  } catch (error: any) {
    console.error('Chat Engine Error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}
