import { getProvider } from './llm-providers';
import { Provider } from './types';

export interface ProofOfWorkItem {
  id: string;
  type: 'github_repo' | 'github_commit' | 'portfolio_link' | 'assessment';
  title: string;
  description: string;
  url: string;
  verifiedAt: string;
  metrics?: Record<string, any>;
}

export interface CandidateMemory {
  coreSkills: string[];
  verifiableMetrics: string[];
  careerGoals: string;
  identifiedGaps: string[];
  careerLevel: string; // V4.0 Addition
  // Tracks if the AI has enough information to generate a highly competitive resume
  dataSufficiencyScore: number; 
  // V5.0 Pivot Additions
  proofOfWork: ProofOfWorkItem[];
  verifiedSkills: string[];

  resumeFileName?: string | null;
  resumeBase64?: string | null;
  resumeUploadedAt?: string | null;
}

export const defaultMemory: CandidateMemory = {
  coreSkills: [],
  verifiableMetrics: [],
  careerGoals: '',
  identifiedGaps: [],
  careerLevel: 'Entry Level',
  dataSufficiencyScore: 0,
  proofOfWork: [],
  verifiedSkills: [],
  resumeFileName: null,
  resumeBase64: null,
  resumeUploadedAt: null
};

// V4.0 Local Storage Helpers
export const MEMORY_STORAGE_KEY = 'cf_permanent_memory';
export const RESUME_STORAGE_KEY = 'cf_master_resume';

export function saveMemoryToLocal(memory: CandidateMemory) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  }
}

export function loadMemoryFromLocal(): CandidateMemory {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as CandidateMemory;
      } catch (e) {
        console.error("Failed to parse local memory");
      }
    }
  }
  return defaultMemory;
}

/**
 * Updates the candidate's permanent memory profile based on the latest chat interaction.
 * Acts as a local, lightweight RAG update loop.
 */
export async function updateMemory(
  currentMemory: CandidateMemory,
  latestUserMessage: string,
  jobDescription: string,
  providerName: Provider,
  model: string,
  apiKey: string,
  realism: 'supportive' | 'brutal' = 'brutal'
): Promise<CandidateMemory> {
  const provider = getProvider(providerName);

  const realismRules = realism === 'brutal'
    ? `PERSONALITY & REALISM RULE (BRUTAL REALISM):
Be brutally honest, stark, and completely realistic. 
Assess their careerLevel strictly based on real credentials, not inflated titles.
Make sure to populate identifiedGaps with real, critical obstacles. Keep dataSufficiencyScore strict (only raise it above 85 if they provide concrete, verifiable numbers and details).`
    : `PERSONALITY & REALISM RULE (SUPPORTIVE COACHING):
Highlight strengths and frame credentials positively. Be encouraging.`;

  const prompt = `
You are the Memory Manager of an Enterprise AI Career System.
Your job is to extract VERIFIABLE FACTS from the user's latest message and update their permanent memory profile.
Cross-reference these facts with the provided Job Description to determine if we have enough data (dataSufficiencyScore 0-100) to write a top-tier resume.

${realismRules}

CRITICAL GUARDRAILS:
1. ONLY extract hard skills, numbers, tools, and direct business impact.
2. IGNORE fluff, opinions, or AI buzzwords.
3. DO NOT hallucinate. If the user didn't explicitly say it, do not add it.
4. Update the dataSufficiencyScore based on how close we are to having all the metrics needed for the Job Description. (Score > 85 means we are ready to build).
5. Infer the candidate's career level (e.g., "Entry Level", "Mid Level", "Senior", "Executive").

--- CURRENT MEMORY ---
${JSON.stringify(currentMemory, null, 2)}

--- TARGET JOB DESCRIPTION ---
${jobDescription}

--- LATEST USER MESSAGE ---
${latestUserMessage}

Return ONLY a valid JSON object matching this exact structure, with the updated arrays and score:
{
  "coreSkills": ["skill1", "skill2"],
  "verifiableMetrics": ["increased sales by 20%", "managed team of 5"],
  "careerGoals": "summary of their stated goals",
  "identifiedGaps": ["missing AWS certification", "needs more leadership examples"],
  "careerLevel": "Senior",
  "dataSufficiencyScore": 75
}
`;

  try {
    const rawResponse = await provider.callAPI(prompt, apiKey, model);
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    const newMemory = JSON.parse(jsonString) as CandidateMemory;
    
    // Ensure all fields exist
    return {
      coreSkills: newMemory.coreSkills || currentMemory.coreSkills || [],
      verifiableMetrics: newMemory.verifiableMetrics || currentMemory.verifiableMetrics || [],
      careerGoals: newMemory.careerGoals || currentMemory.careerGoals || '',
      identifiedGaps: newMemory.identifiedGaps || currentMemory.identifiedGaps || [],
      careerLevel: newMemory.careerLevel || currentMemory.careerLevel || 'Entry Level',
      dataSufficiencyScore: newMemory.dataSufficiencyScore || currentMemory.dataSufficiencyScore || 0,
      proofOfWork: currentMemory.proofOfWork || [],
      verifiedSkills: currentMemory.verifiedSkills || []
    };
  } catch (err) {
    console.error("Failed to update memory:", err);
    // On failure, fail safe by returning current memory
    return currentMemory;
  }
}
