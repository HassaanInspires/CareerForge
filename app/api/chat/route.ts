import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/documentParser';
import { getProvider } from '@/lib/llm-providers';
import { updateMemory, CandidateMemory, defaultMemory } from '@/lib/memory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      messages, 
      resumeBase64, 
      resumeFileName, 
      jobDescription, 
      memory, 
      provider: providerName, 
      model, 
      userApiKey 
    } = body;

    if (!resumeBase64 || !jobDescription || !providerName || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Decode Resume (could cache this, but parsing is usually fast)
    let resumeText = '';
    try {
      const buffer = Buffer.from(resumeBase64, 'base64');
      const uint8Array = new Uint8Array(buffer);
      resumeText = await extractTextFromFile(uint8Array, resumeFileName || 'resume.pdf');
    } catch (err: any) {
      return NextResponse.json({ error: `File Parsing Error: ${err.message}` }, { status: 422 });
    }

    const provider = getProvider(providerName);
    let currentMemory: CandidateMemory = memory || defaultMemory;

    // 2. Update Memory if user just replied
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMsg = messages[messages.length - 1].content;
      currentMemory = await updateMemory(currentMemory, lastUserMsg, jobDescription, providerName, model, userApiKey);
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

    const prompt = `
You are an elite, highly critical Executive Career Coach.
Your goal is to extract strictly verifiable, quantitative metrics and specific technical skills from the user to map their Resume to the Job Description.

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
