import { Preferences } from './types';
import { CandidateMemory } from './memory';

/**
 * Calculates a weighted match score based on various criteria
 */
export function calculateMatchScore(
  keywordPercentage: number,
  experiencePercentage: number,
  skillsPercentage: number,
  tonePercentage: number
): number {
  const weights = {
    keyword: 0.3,
    experience: 0.3,
    skills: 0.3,
    tone: 0.1,
  };

  const score =
    keywordPercentage * weights.keyword +
    experiencePercentage * weights.experience +
    skillsPercentage * weights.skills +
    tonePercentage * weights.tone;

  return Math.round(score);
}

/**
 * Extracts potential keywords from a block of text
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Basic implementation: remove punctuation, lowercase, and filter for common stop words
  const stopWords = new Set(['and', 'the', 'for', 'with', 'from', 'that', 'this', 'your', 'will', 'have']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .filter((value, index, self) => self.indexOf(value) === index); // Unique values
}

/**
 * Formats a date object into a human-readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Generates a prompt for the AI model based on user input and preferences
 */
export function generatePrompt(
  resume: string,
  jobDescription: string,
  memory: CandidateMemory,
  preferences: Preferences
): string {
  const { tone, length, focus } = preferences;

  let prompt = `You are an elite, highly critical AI Career Consultant.
Your mission is to generate a highly optimized resume that is 100% authentic, verifiable, and free of generic AI buzzwords.

--- VERIFIED CANDIDATE MEMORY ---
Core Skills: ${memory.coreSkills.join(', ')}
Verifiable Metrics: ${memory.verifiableMetrics.join(', ')}

--- ORIGINAL RESUME ---
${resume}

--- TARGET JOB DESCRIPTION ---
${jobDescription}

--- PREFERENCES ---
Tone: ${tone}
Length: ${length}
Focus: ${focus}

STRICT GUARDRAILS & AUTHENTICITY RULES:
1. ONLY include metrics and facts from the "VERIFIED CANDIDATE MEMORY" or the "ORIGINAL RESUME".
2. DO NOT hallucinate numbers, skills, or projects under any circumstances.
3. Remove generic AI words (e.g., "Spearheaded", "Synergized", "Delved", "Navigated"). Use plain, powerful verbs (e.g., "Led", "Built", "Managed").
4. If a skill required by the JD is missing, DO NOT add it to the resume. Instead, list it in the "missingSkills" array.
5. Provide a precisionScore object evaluating 'atsCompatibility' (0-100) and 'humanReadability' (0-100).
6. Provide a 'gapAnalysis' array detailing blocking factors.
7. Provide a 'careerRoadmap' array outlining actionable steps to bridge the gaps.
8. Use Chain-of-Thought reasoning. First, output a <thought> block evaluating the gaps and deciding how to frame the authentic metrics. Then, output exactly the JSON structure requested.

Format your output EXACTLY as follows:

<thought>
(Your reasoning here)
</thought>

{
  "optimizedResume": "...",
  "matchScore": 85,
  "breakdown": { "keywordMatch": 80, "experienceMatch": 90, "skillsMatch": 85, "toneMatch": 85 },
  "missingSkills": [ { "name": "React", "category": "hard", "importance": "high" } ],
  "smartQuestions": { "System Notice": "Dynamic questions are now handled by the Memory Engine." },
  "suggestions": ["suggestion1"],
  "careerRoadmap": ["step1", "step2"],
  "gapAnalysis": ["gap1", "gap2"],
  "marketEvaluation": "market details",
  "precisionScore": { "atsCompatibility": 85, "humanReadability": 90 }
}`;

  return prompt;
}
