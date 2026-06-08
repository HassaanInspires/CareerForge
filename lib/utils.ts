import { Preferences, SmartQuestions } from './types';

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
  questions: SmartQuestions,
  preferences: Preferences
): string {
  const { tone, length, focus } = preferences;

  let prompt = `You are an expert career coach and resume optimizer. 
    
Analyze the following resume and job description. 
    
--- RESUME ---
${resume}

--- JOB DESCRIPTION ---
${jobDescription}

--- PREFERENCES ---
Tone: ${tone}
Length: ${length}
Focus: ${focus}

--- ADDITIONAL CONTEXT FROM USER ---
${Object.entries(questions)
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join('\n')}

INSTRUCTIONS:
1. Rewrite the resume to better align with the job description.
2. Maintain a ${tone} tone and a ${length} length.
3. Focus heavily on ${focus}.
4. Provide a match score (0-100), a breakdown of the match, missing skills, and smart questions for further optimization.
5. Provide a 'precisionScore' object with 'atsCompatibility' (0-100) and 'humanReadability' (0-100).
6. Provide a 'gapAnalysis' array of strings detailing specific blocking factors or missing qualifications.
7. Provide a 'careerRoadmap' array of strings with actionable steps (courses, certs, experiences) to bridge skill gaps.
8. Provide a 'marketEvaluation' string summarizing the market demand and recommendations for this role.
9. Format the entire output EXACTLY as this JSON structure: 
{
  "optimizedResume": "...",
  "matchScore": 85,
  "breakdown": { "keywordMatch": 80, "experienceMatch": 90, "skillsMatch": 85, "toneMatch": 85 },
  "missingSkills": [ { "name": "React", "category": "hard", "importance": "high" } ],
  "smartQuestions": { "question1": "answer1" },
  "suggestions": ["suggestion1"],
  "careerRoadmap": ["step1", "step2"],
  "gapAnalysis": ["gap1", "gap2"],
  "marketEvaluation": "market details",
  "precisionScore": { "atsCompatibility": 85, "humanReadability": 90 }
}`;

  return prompt;
}
