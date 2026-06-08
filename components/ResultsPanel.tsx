'use client';

import React, { useState } from 'react';
import { OptimizeResponse, Provider } from '@/lib/types';

interface ResultsPanelProps {
  result: OptimizeResponse;
  onReset: () => void;
}

export default function ResultsPanel({ result: initialResult, onReset }: ResultsPanelProps) {
  const [result, setResult] = useState<OptimizeResponse>(initialResult);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState('');

  // Safely handle potentially missing data from LLM response
  const breakdown = result?.breakdown || {};
  const missingSkills = result?.missingSkills || [];
  const suggestions = result?.suggestions || [];
  const optimizedResume = result?.optimizedResume || '';
  const matchScore = result?.matchScore ?? 0;
  
  // V4.0 Advanced Score
  const careerRoadmap = result?.careerRoadmap || [];
  const gapAnalysis = result?.gapAnalysis || [];
  const marketEvaluation = result?.marketEvaluation || '';
  const advancedScore = result?.advancedScore || {
    overall: matchScore,
    atsParsability: 0,
    impactDensity: 0,
    keywordAlignment: 0,
    explanation: 'Score processing...'
  };

  const handleCopy = (text: string, section: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getSkillColorClass = (importance: string) => {
    switch (importance) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return '';
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isRefining) return;
    
    setIsRefining(true);
    setRefineError('');
    const userMsg = chatInput;
    setChatInput('');

    try {
      const provider = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
      const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
      const model = localStorage.getItem(`cf_model_${provider}`) || '';

      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentResume: result.optimizedResume,
          userInstruction: userMsg,
          provider,
          model,
          userApiKey: apiKey
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update the result with the newly refined resume
      setResult(prev => ({
        ...prev,
        optimizedResume: data.refinedResume
      }));
    } catch (err: any) {
      setRefineError(err.message);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Match Score Card */}
        <div className="glass-card flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-6">Advanced Overall Score</h3>
          <div className={`match-score-gauge ${getScoreColorClass(advancedScore.overall)}`}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="40" />
              <circle cx="60" cy="60" r="40" style={{ strokeDashoffset: 251.2 - (251.2 * advancedScore.overall) / 100 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">{advancedScore.overall}%</span>
            </div>
          </div>
          <div className="mt-6 w-full flex justify-between text-xs font-medium px-2 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-blue)]">{advancedScore.atsParsability}%</span>
              <span className="text-[var(--color-text-secondary)] mt-1 text-center">ATS Ready</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-purple)]">{advancedScore.impactDensity}%</span>
              <span className="text-[var(--color-text-secondary)] mt-1 text-center">Impact</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-success)]">{advancedScore.keywordAlignment}%</span>
              <span className="text-[var(--color-text-secondary)] mt-1 text-center">Keywords</span>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="md:col-span-2 glass-card p-6">
          <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-4">Score Explanation</h3>
          <p className="text-sm text-white mb-6 p-4 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-medium)]">
            {advancedScore.explanation}
          </p>

          <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-4">Core Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-[var(--color-text-secondary)]">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{value}%</span>
                </div>
                <div className="w-full bg-[var(--color-bg-tertiary)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--color-accent-blue)] h-full transition-all duration-1000" style={{ width: `${Number(value)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          
          {marketEvaluation && (
            <div className="mt-6 p-4 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[var(--color-border-light)]">
              <h4 className="text-xs font-bold text-[var(--color-accent-orange)] uppercase tracking-wider mb-2">Market Evaluation</h4>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{marketEvaluation}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gap Analysis */}
        <div className="glass-card p-6">
          <h3 className="text-[var(--color-text-primary)] font-heading font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--color-error)] flex items-center justify-center mr-3">⚠️</span>
            Gap Analysis
          </h3>
          <ul className="space-y-3">
            {gapAnalysis.length > 0 ? (
              gapAnalysis.map((gap, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-error)] mt-0.5">▪</span>
                  {gap}
                </li>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-disabled)] italic">No blocking factors identified.</p>
            )}
          </ul>
        </div>

        {/* Missing Skills */}
        <div className="glass-card p-6">
          <h3 className="text-[var(--color-text-primary)] font-heading font-bold mb-4 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)] flex items-center justify-center mr-3">🔧</span>
            Missing Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill, idx) => (
                <span 
                  key={idx}
                  className={`badge animate-pop-in ${getSkillColorClass(skill.importance)}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {skill.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-disabled)] italic">No specific skill gaps identified.</p>
            )}
          </div>
        </div>
      </div>

      {/* Refinement Chat V4.0 */}
      <div className="glass-card p-0 border-2 border-[var(--color-accent-purple)]">
        <div className="p-4 bg-[rgba(143,0,255,0.1)] border-b border-[var(--color-accent-purple)] flex justify-between items-center">
          <h3 className="font-heading font-bold text-white flex items-center gap-2">
            <span>✨</span> Refine with AI
          </h3>
        </div>
        <div className="p-4 bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-secondary)]">
          Want to change something? Ask the AI to rewrite specific bullet points, change the tone, or adjust the length.
        </div>
        <div className="p-4">
          <form onSubmit={handleRefine} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput} 
              onChange={e => setChatInput(e.target.value)} 
              placeholder="E.g. Make the summary shorter, or add more technical details to the second job..."
              className="input-field text-sm flex-1"
              disabled={isRefining}
            />
            <button type="submit" className="btn-primary py-2 px-4" disabled={!chatInput.trim() || isRefining}>
              {isRefining ? 'Refining...' : 'Send'}
            </button>
          </form>
          {refineError && <p className="text-[var(--color-error)] text-xs mt-2">{refineError}</p>}
        </div>
      </div>

      {/* Optimized Content Sections */}
      <div className="space-y-6">
        <div className="glass-card p-0">
          <div className="p-4 bg-[rgba(255,255,255,0.02)] border-b border-[var(--color-border-medium)] flex justify-between items-center">
            <h3 className="font-heading font-bold text-[var(--color-text-primary)]">Final Output</h3>
            <button 
              onClick={() => handleCopy(optimizedResume, 'resume')}
              disabled={!optimizedResume}
              className="text-xs font-medium text-[var(--color-accent-blue)] hover:text-[var(--color-accent-blue-dark)] bg-[rgba(0,212,255,0.1)] px-3 py-1.5 rounded-lg border border-[var(--color-accent-blue)] transition-all disabled:opacity-50"
            >
              {copiedSection === 'resume' ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <div className="p-6 overflow-x-auto relative min-h-[200px]">
             {isRefining && (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10 rounded-b-xl">
                 <div className="text-white flex flex-col items-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-accent-purple)] mb-2"></div>
                   <span>Applying refinements...</span>
                 </div>
               </div>
             )}
            {optimizedResume ? (
              <div className="prose prose-invert max-w-none">
                 <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)] font-body leading-relaxed">
                   {optimizedResume}
                 </pre>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-disabled)] italic">No optimized content generated.</p>
            )}
          </div>
        </div>

        {/* Suggestions & Roadmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="font-heading font-bold text-[var(--color-text-primary)] mb-4">Actionable Suggestions</h3>
            {suggestions.length > 0 ? (
              <ul className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-accent-blue)] mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-text-disabled)] italic">No suggestions provided.</p>
            )}
          </div>
          <div className="glass-card p-6">
            <h3 className="font-heading font-bold text-[var(--color-text-primary)] mb-6 flex items-center">
              <span className="w-6 h-6 rounded-lg bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] flex items-center justify-center mr-3 text-sm">🗺️</span>
              Career Roadmap
            </h3>
            <div className="space-y-4">
              {careerRoadmap.length > 0 ? (
                careerRoadmap.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-3 rounded-xl border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.02)]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] flex items-center justify-center font-bold font-heading text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{step}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-disabled)] italic">No roadmap steps provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button 
          onClick={onReset}
          className="btn-primary px-8 py-3 text-lg"
        >
          Start New Optimization
        </button>
      </div>
    </div>
  );
}
