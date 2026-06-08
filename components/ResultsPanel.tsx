'use client';

import React, { useState } from 'react';
import { OptimizeResponse } from '@/lib/types';

interface ResultsPanelProps {
  result: OptimizeResponse;
  onReset: () => void;
}

export default function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Safely handle potentially missing data from LLM response
  const breakdown = result?.breakdown || {};
  const missingSkills = result?.missingSkills || [];
  const suggestions = result?.suggestions || [];
  const smartQuestions = result?.smartQuestions || {};
  const optimizedResume = result?.optimizedResume || '';
  const matchScore = result?.matchScore ?? 0;
  
  // V2.0 SkilledScore-like features
  const careerRoadmap = result?.careerRoadmap || [];
  const gapAnalysis = result?.gapAnalysis || [];
  const marketEvaluation = result?.marketEvaluation || '';
  const precisionScore = result?.precisionScore || { atsCompatibility: 0, humanReadability: 0 };

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Match Score Card */}
        <div className="glass-card flex flex-col items-center justify-center p-6 text-center">
          <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-6">Overall Match Score</h3>
          <div className={`match-score-gauge ${getScoreColorClass(matchScore)}`}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="40" />
              <circle cx="60" cy="60" r="40" style={{ strokeDashoffset: 251.2 - (251.2 * matchScore) / 100 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-heading font-bold text-[var(--color-text-primary)]">{matchScore}%</span>
            </div>
          </div>
          <div className="mt-6 w-full flex justify-between text-xs font-medium px-4">
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-blue)]">{precisionScore.atsCompatibility}%</span>
              <span className="text-[var(--color-text-secondary)] mt-1">ATS Ready</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-accent-purple)]">{precisionScore.humanReadability}%</span>
              <span className="text-[var(--color-text-secondary)] mt-1">Readability</span>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="md:col-span-2 glass-card p-6">
          <h3 className="text-[var(--color-text-secondary)] text-sm font-medium mb-4">Breakdown</h3>
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
            {Object.keys(breakdown).length === 0 && (
              <p className="text-sm text-[var(--color-text-disabled)] italic col-span-2">No breakdown data provided by AI.</p>
            )}
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

      {/* Career Roadmap */}
      <div className="glass-card p-6">
        <h3 className="text-[var(--color-text-primary)] font-heading font-bold mb-6 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] flex items-center justify-center mr-3">🗺️</span>
          Actionable Career Roadmap
        </h3>
        <div className="space-y-4">
          {careerRoadmap.length > 0 ? (
            careerRoadmap.map((step, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.02)]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] flex items-center justify-center font-bold font-heading">
                  {idx + 1}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1.5">{step}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--color-text-disabled)] italic">No roadmap steps provided.</p>
          )}
        </div>
      </div>

      {/* Optimized Content Sections */}
      <div className="space-y-6">
        <div className="glass-card p-0">
          <div className="p-4 bg-[rgba(255,255,255,0.02)] border-b border-[var(--color-border-medium)] flex justify-between items-center">
            <h3 className="font-heading font-bold text-[var(--color-text-primary)]">Optimized Resume Content</h3>
            <button 
              onClick={() => handleCopy(optimizedResume, 'resume')}
              disabled={!optimizedResume}
              className="text-xs font-medium text-[var(--color-accent-blue)] hover:text-[var(--color-accent-blue-dark)] bg-[rgba(0,212,255,0.1)] px-3 py-1.5 rounded-lg border border-[var(--color-accent-blue)] transition-all disabled:opacity-50"
            >
              {copiedSection === 'resume' ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          <div className="p-6 overflow-x-auto">
            {optimizedResume ? (
              <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)] font-body leading-relaxed">
                {optimizedResume}
              </pre>
            ) : (
              <p className="text-sm text-[var(--color-text-disabled)] italic">No optimized content generated.</p>
            )}
          </div>
        </div>

        {/* Suggestions & Questions */}
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
            <h3 className="font-heading font-bold text-[var(--color-text-primary)] mb-4">Follow-up Questions</h3>
            <div className="space-y-4">
              {Object.keys(smartQuestions).length > 0 ? (
                Object.entries(smartQuestions).map(([q, a], idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-semibold text-[var(--color-text-primary)]">{q}</p>
                    <p className="text-[var(--color-text-secondary)] mt-1 italic">{a || 'Requires your input for further optimization'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-disabled)] italic">No follow-up questions available.</p>
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
