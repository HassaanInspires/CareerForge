'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RESUME_STORAGE_KEY } from '@/lib/memory';

interface StepOneProps {
  onNext: (data: { resumeBase64: string; fileName: string; path: 'A' | 'B' }) => void;
  onError: (error: string) => void;
}

export default function StepOne({ onNext, onError }: StepOneProps) {
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  useEffect(() => {
    const res = localStorage.getItem(RESUME_STORAGE_KEY);
    setHasResume(!!res);
  }, []);

  const handleSelectPath = (path: 'A' | 'B') => {
    const base64 = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!base64) {
      onError('Master CV not found. Please upload it in the Profile Hub.');
      return;
    }
    onNext({ resumeBase64: base64, fileName: 'MasterCV.pdf', path });
  };

  if (hasResume === null) return <div className="p-12 text-center">Loading...</div>;

  if (!hasResume) {
    return (
      <div className="space-y-6 animate-fade-in text-center p-12">
        <h2 className="text-2xl font-bold text-white mb-2">Master CV Required</h2>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
          CareerForge V4.0 uses a centralized Candidate Memory graph. You must upload your Master CV in the Profile Hub before starting an assessment.
        </p>
        <Link href="/profile" className="btn-primary">
          Go to Profile Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">Select Assessment Mode</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Choose how you want to leverage your Candidate Memory Graph today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => handleSelectPath('A')}
          className="flex flex-col items-center p-8 text-center border-2 border-[var(--color-border-medium)] rounded-xl hover:border-[var(--color-accent-blue)] bg-[var(--color-bg-tertiary)] transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Target a Specific Job</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Paste a job description. The AI will interview you for missing gaps and generate a highly targeted resume.
          </p>
        </button>

        <button 
          onClick={() => handleSelectPath('B')}
          className="flex flex-col items-center p-8 text-center border-2 border-[var(--color-border-medium)] rounded-xl hover:border-[var(--color-accent-purple)] bg-[var(--color-bg-tertiary)] transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-[rgba(143,0,255,0.1)] flex items-center justify-center mb-4">
            <span className="text-2xl">🧭</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Career Level Assessment</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Let the AI evaluate your permanent memory to determine your market level and suggest suitable job titles.
          </p>
        </button>
      </div>
    </div>
  );
}
