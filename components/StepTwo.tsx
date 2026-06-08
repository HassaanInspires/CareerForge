'use client';

import React, { useState } from 'react';

interface StepTwoProps {
  currentData: string;
  onNext: (jobDescription: string) => void;
  onBack: () => void;
}

export default function StepTwo({ currentData, onNext, onBack }: StepTwoProps) {
  const [jobDescription, setJobDescription] = useState(currentData || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Job description cannot be empty.');
      return;
    }
    onNext(jobDescription);
  };

  return (
    <div className="space-y-6 animate-fade-in animate-slide-in-left">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">Job Description</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Paste the job description you want to optimize your resume for.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            id="job-description"
            rows={10}
            className={`input-field block w-full resize-y ${
              error ? 'border-[var(--color-error)]' : ''
            }`}
            placeholder="e.g. We are looking for a Senior Software Engineer with 5+ years of experience in React and Node.js..."
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (error) setError(null);
            }}
          />
          <div className="mt-2 flex justify-between items-center text-xs text-[var(--color-text-disabled)]">
            <span>{jobDescription.length} characters</span>
            {error && <span className="text-[var(--color-error)] font-medium">{error}</span>}
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
            type="submit"
            className="flex-1 btn-primary"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
