/**
 * Supported AI model providers
 */
export type Provider = 'anthropic' | 'openai' | 'gemini' | 'groq' | 'mistral';
import { CandidateMemory } from './memory';

/**
 * User preferences for optimization
 */
export interface Preferences {
  tone: 'professional' | 'creative' | 'technical' | 'concise';
  length: 'short' | 'standard' | 'detailed';
  focus: 'skills' | 'experience' | 'achievements';
}

/**
 * Smart questions for gathering more context from the user
 */
export interface SmartQuestions {
  [key: string]: string;
}

/**
 * Missing skills identified in the resume compared to the job description
 */
export interface MissingSkill {
  name: string;
  category: 'hard' | 'soft' | 'tool';
  importance: 'high' | 'medium' | 'low';
}

/**
 * Detailed breakdown of the match score
 */
export interface MatchBreakdown {
  keywordMatch: number;
  experienceMatch: number;
  skillsMatch: number;
  toneMatch: number;
}

/**
 * Payload sent to the optimization API
 */
export interface OptimizeRequest {
  resumeBase64: string;
  resumeFileName: string;
  jobDescription: string;
  provider: Provider;
  model: string;
  preferences: Preferences;
  memory?: CandidateMemory;
  userApiKey?: string;
  additionalContext?: string;
  realism?: 'supportive' | 'brutal';
}

/**
 * Response received from the optimization API
 */
export interface OptimizeResponse {
  optimizedResume: string;
  matchScore: number;
  breakdown: MatchBreakdown;
  missingSkills: MissingSkill[];
  smartQuestions: SmartQuestions;
  suggestions: string[];
  careerRoadmap: string[];
  gapAnalysis: string[];
  marketEvaluation: string;
  advancedScore: {
    overall: number;
    atsParsability: number;
    impactDensity: number;
    keywordAlignment: number;
    explanation: string;
  };
}

/**
 * State of the resume optimization form
 */
export interface FormState {
  resumeFile: File | null;
  resumeText: string;
  jobDescription: string;
  isOptimizing: boolean;
  error: string | null;
  result: OptimizeResponse | null;
}
