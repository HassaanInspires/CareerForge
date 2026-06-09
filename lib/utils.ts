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
  preferences: Preferences,
  realism: 'supportive' | 'brutal' = 'brutal'
): string {
  const { tone, length, focus } = preferences;

  const isCareerAssessment = jobDescription === '[CAREER_ASSESSMENT_MODE]';

  const realismInstructions = realism === 'brutal'
    ? `PERSONALITY & REALISM RULE (BRUTAL REALISM):
You must be BRUTALLY HONEST, stark, and completely realistic. 
Never compromise or inflate credentials. If they lack experience or skills, state it plainly. 
Specifically call out exactly what roles they QUALIFY for, and what roles they CANNOT qualify for. 
For career level assessment, do not make it look generic; give a highly realistic, granular corporate evaluation of their standing (e.g. "L5 Senior SWE - plateaued on system design gaps" or "Junior Web Developer - qualifies only for internship/entry-level support roles").
Identify deep deficiencies, salary ceilings, and true market standing.`
    : `PERSONALITY & REALISM RULE (SUPPORTIVE COACHING):
Be supportive, encouraging, and optimistic. Focus on framing their credentials in the best possible corporate light, highlighting potential and transferrable skills.`;

  const systemRole = isCareerAssessment 
    ? `You are an elite AI Executive Career Coach. Your goal is to evaluate the candidate's career level, market fit, and suggest optimal job roles.
${realismInstructions}`
    : `You are an elite, highly critical AI Proof-of-Work Engineer. Your mission is to generate a 'Verified Career Graph' or 'Anti-Resume' that presents the candidate's verified skills, Proof of Work, and true market fit. Do not write a traditional resume. Write a Proof of Work Profile that employers can trust.
${realismInstructions}`;

  const outputFormat = isCareerAssessment
    ? `
5. Provide an 'advancedScore' object evaluating 'overall' (0-100), 'atsParsability' (0-100), 'impactDensity' (0-100), 'keywordAlignment' (0-100), and an 'explanation'.
6. In 'optimizedResume', output a comprehensive Markdown report detailing their Career Level, Market Fit, Salary Estimates, Gaps, and Next Steps.
`
    : `
5. Provide an 'advancedScore' object evaluating 'overall' (0-100), 'atsParsability' (0-100), 'impactDensity' (0-100), 'keywordAlignment' (0-100), and an 'explanation' string explaining the score.
6. Provide a 'gapAnalysis' array detailing blocking factors.
7. Provide a 'careerRoadmap' array outlining actionable steps to bridge the gaps.
8. In 'optimizedResume', output a Markdown-formatted "Verified PoW Profile". This should include a short brutal summary, a list of verified skills, and explanations of their Proof of Work (metrics, projects). DO NOT format it as a standard chronological resume.
9. Use Chain-of-Thought reasoning. First, output a <thought> block evaluating the gaps and deciding how to frame the authentic metrics. Then, output exactly the JSON structure requested.
`;

  let prompt = `${systemRole}

--- VERIFIED CANDIDATE MEMORY ---
Career Level: ${memory.careerLevel || 'Unknown'}
Core Skills: ${memory.coreSkills.join(', ')}
Verifiable Metrics: ${memory.verifiableMetrics.join(', ')}
Proof of Work (GitHub/Assessments): ${JSON.stringify(memory.proofOfWork?.map(p => p.title) || [])}

--- ORIGINAL RESUME ---
${resume}

${isCareerAssessment ? '' : `--- TARGET JOB DESCRIPTION ---\n${jobDescription}`}

--- PREFERENCES ---
Tone: ${tone}
Length: ${length}
Focus: ${focus}

STRICT GUARDRAILS & AUTHENTICITY RULES:
1. ONLY include metrics and facts from the "VERIFIED CANDIDATE MEMORY" or the "ORIGINAL RESUME".
2. DO NOT hallucinate numbers, skills, or projects under any circumstances.
3. Remove generic AI words (e.g., "Spearheaded", "Synergized", "Delved", "Navigated"). Use plain, powerful verbs (e.g., "Led", "Built", "Managed").
4. If a skill required by the JD is missing, DO NOT add it to the resume. Instead, list it in the "missingSkills" array.
${outputFormat}

Format your output EXACTLY as follows:

<thought>
(Your reasoning here)
</thought>

{
  "optimizedResume": "...",
  "matchScore": 85,
  "breakdown": { "keywordMatch": 80, "experienceMatch": 90, "skillsMatch": 85, "toneMatch": 85 },
  "missingSkills": [ { "name": "React", "category": "hard", "importance": "high" } ],
  "smartQuestions": { "System Notice": "Handled by Memory Engine" },
  "suggestions": ["suggestion1"],
  "careerRoadmap": ["step1", "step2"],
  "gapAnalysis": ["gap1", "gap2"],
  "marketEvaluation": "market details",
  "advancedScore": { "overall": 85, "atsParsability": 90, "impactDensity": 70, "keywordAlignment": 80, "explanation": "Brief explanation of the score" }
}`;

  return prompt;
}
