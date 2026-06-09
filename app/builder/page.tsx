'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { loadUserMemory, saveUserHistory } from '@/app/actions/memory';
import { CandidateMemory, defaultMemory } from '@/lib/memory';
import { Provider, OptimizeResponse } from '@/lib/types';
import ResultsPanel from '@/components/ResultsPanel';
import Link from 'next/link';

export default function TargetMatchEngine() {
  const { data: session, status } = useSession();
  const [memory, setMemory] = useState<CandidateMemory | null>(null);
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const initMemory = async () => {
      const mem = await loadUserMemory();
      setMemory(mem || defaultMemory);
    };
    initMemory();
  }, [status]);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a target job description.");
      return;
    }

    setStep(2); // Loading State
    setIsOptimizing(true);
    setError(null);

    const provider = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
    const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
    const model = localStorage.getItem(`cf_model_${provider}`) || '';

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          provider,
          model,
          userApiKey: apiKey,
          memory,
          preferences: { tone: 'technical', length: 'standard', focus: 'skills' },
          realism: 'brutal',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze fit');

      setResult(data);
      setStep(3); // Results State

      // Save to database Session History
      try {
        await saveUserHistory(
          `Job Match: ${jobDescription.substring(0, 40)}...`,
          data.advancedScore?.explanation || 'Brutal Reality Check evaluated.',
          data.advancedScore?.overall || 0,
          'A',
          data.optimizedResume
        );
      } catch (hErr) {
        console.error("Failed to write session history:", hErr);
      }
    } catch (err: any) {
      setError(err.message);
      setStep(1); // Go back to input
    } finally {
      setIsOptimizing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setJobDescription('');
  };

  if (status === 'loading' || !memory) {
    return <div className="min-h-screen flex items-center justify-center">Loading Verified Graph...</div>;
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center btn-primary p-0">
              <span className="text-white font-heading font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-heading font-black text-white tracking-tight">
              Target<span style={{ color: "var(--color-accent-orange)" }}>Match</span> Engine
            </h1>
          </Link>
          <Link href="/profile" className="text-sm text-[var(--color-text-secondary)] hover:text-white">Back to Profile Hub</Link>
        </header>

        <div className="glass-card min-h-[500px]">
          <div className="p-2 md:p-6">
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Target a Role</h2>
                  <p className="text-[var(--color-text-secondary)]">
                    Paste the job description. The AI will cross-reference it against your Verified Graph (CV + Proof of Work) and generate a Brutal Reality Check and Employer Brief.
                  </p>
                </div>

                <div className="bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[var(--color-border-medium)]">
                  <h3 className="text-sm font-medium text-[var(--color-accent-purple)] mb-2">Your Current Verified Graph Data:</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                    • {memory.coreSkills.length} Verified Skills<br/>
                    • {memory.proofOfWork?.length || 0} Proof-of-Work Artifacts (GitHub/Assessments)<br/>
                    • Base CV uploaded: {memory.coreSkills.length > 0 ? "Yes" : "No"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Target Job Description</label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description here..."
                    className="input-field w-full h-64 resize-none font-mono text-sm leading-relaxed"
                  />
                  {error && <p className="text-[var(--color-error)] text-sm">{error}</p>}
                </div>

                <button onClick={handleAnalyze} className="btn-primary w-full py-4 text-lg">
                  Run Brutal Reality Check
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--color-bg-tertiary)]"></div>
                  <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-t-[var(--color-accent-orange)] border-r-[var(--color-accent-purple)] border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">Cross-Referencing Proof of Work...</h3>
                <p className="text-[var(--color-text-secondary)]">Evaluating your claims against actual data.</p>
              </div>
            )}

            {step === 3 && result && (
              <div className="animate-bounce-in">
                <ResultsPanel result={result} onReset={reset} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
