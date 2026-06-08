'use client';

import React, { useState } from 'react';
import { Preferences } from '@/lib/types';

interface StepFourProps {
  currentPreferences: Preferences;
  currentOutputOptions: string[];
  onNext: (data: { preferences: Preferences; outputOptions: string[] }) => void;
  onBack: () => void;
}

export default function StepFour({ currentPreferences, currentOutputOptions, onNext, onBack }: StepFourProps) {
  const [preferences, setPreferences] = useState<Preferences>(currentPreferences || {
    tone: 'professional',
    length: 'standard',
    focus: 'skills'
  });
  
  const [outputOptions, setOutputOptions] = useState<string[]>(currentOutputOptions || []);

  const options = [
    { id: 'optimized-resume', label: 'Optimized Resume' },
    { id: 'cover-letter', label: 'Cover Letter' },
    { id: 'missing-skills', label: 'Missing Skills Analysis' },
    { id: 'interview-prep', label: 'Interview Prep Tips' },
  ];

  const toggleOption = (id: string) => {
    setOutputOptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in animate-slide-in-left">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">Preferences & Outputs</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Fine-tune how the AI will rewrite your resume.
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Tone</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['professional', 'creative', 'technical', 'concise'].map((tone) => (
              <button
                key={tone}
                onClick={() => setPreferences({ ...preferences, tone: tone as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                  preferences.tone === tone
                    ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)]'
                    : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)]'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Length</label>
          <div className="grid grid-cols-3 gap-2">
            {['short', 'standard', 'detailed'].map((length) => (
              <button
                key={length}
                onClick={() => setPreferences({ ...preferences, length: length as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                  preferences.length === length
                    ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)]'
                    : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)]'
                }`}
              >
                {length}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Focus Area</label>
          <div className="grid grid-cols-3 gap-2">
            {['skills', 'experience', 'achievements'].map((focus) => (
              <button
                key={focus}
                onClick={() => setPreferences({ ...preferences, focus: focus as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                  preferences.focus === focus
                    ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)]'
                    : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)]'
                }`}
              >
                {focus}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-left mt-8">
        <h3 className="text-lg font-heading font-bold text-[var(--color-text-primary)] mb-4">Output Deliverables</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`relative flex items-center p-3 cursor-pointer rounded-xl border transition-all duration-200 ${
                outputOptions.includes(option.id)
                  ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.05)]'
                  : 'border-[var(--color-border-medium)] hover:border-[var(--color-accent-blue)]'
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)]"
                checked={outputOptions.includes(option.id)}
                readOnly
              />
              <span className="ml-3 text-sm font-medium text-[var(--color-text-primary)]">
                {option.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-[var(--color-border-medium)] bg-transparent py-3 px-4 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onNext({ preferences, outputOptions })}
          className="flex-1 btn-primary"
        >
          Analyze Resume
        </button>
      </div>
    </div>
  );
}
