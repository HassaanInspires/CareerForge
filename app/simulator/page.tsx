'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CandidateMemory } from '@/lib/memory';
import { loadUserMemory, saveUserMemory, saveUserHistory } from '@/app/actions/memory';
import { Provider } from '@/lib/types';
import { useSession } from 'next-auth/react';

export default function SimulatorPage() {
  const { status } = useSession();
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    const prov = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
    setProvider(prov);
    setModel(localStorage.getItem(`cf_model_${prov}`) || '');
    setApiKey(localStorage.getItem(`cf_key_${prov}`) || '');
  }, []);
  const [memory, setMemory] = useState<CandidateMemory | null>(null);
  const [targetSkill, setTargetSkill] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [challenge, setChallenge] = useState<any | null>(null);
  
  const [submission, setSubmission] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const initMemory = async () => {
      const mem = await loadUserMemory();
      setMemory(mem);
    };
    initMemory();
  }, [status]);

  const handleGenerate = async () => {
    if (!targetSkill.trim() || !apiKey) {
      alert("Please enter a target skill and ensure your API key is set in Settings.");
      return;
    }
    setIsGenerating(true);
    setChallenge(null);
    setEvaluation(null);
    setSubmission('');

    try {
      const res = await fetch('/api/challenge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSkill,
          roleContext: memory?.careerLevel || 'Professional',
          provider,
          model,
          userApiKey: apiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChallenge(data.challenge);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluate = async () => {
    if (!submission.trim()) return;
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/challenge/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge,
          submission,
          targetSkill,
          provider,
          model,
          userApiKey: apiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const evalData = data.evaluation;
      setEvaluation(evalData);

      // If passed, save to memory Proof of Work!
      if (evalData.passed && memory) {
        const newPow = {
          id: `assessment-${Date.now()}`,
          type: 'assessment' as const,
          title: `Verified Skill: ${targetSkill}`,
          description: challenge.title,
          url: '#', // Internal assessment doesn't have an external URL
          verifiedAt: new Date().toISOString(),
          metrics: evalData.verifiedMetrics
        };
        const newMemory = { ...memory, proofOfWork: [...(memory.proofOfWork || []), newPow] };
        setMemory(newMemory);
        await saveUserMemory(newMemory);
      }

      // Save to database Session History
      try {
        await saveUserHistory(
          `PoW Simulation: ${targetSkill}`,
          evalData.feedback.substring(0, 100) + '...',
          evalData.score,
          'B',
          evalData.feedback
        );
      } catch (hErr) {
        console.error("Failed to write simulation history:", hErr);
      }

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!memory) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6 md:p-12 font-sans relative overflow-x-hidden">
      <nav className="mb-8 flex justify-between items-center max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80">
          CareerForge <span className="text-[var(--color-accent-purple)] font-mono text-sm ml-2">PoW Simulator</span>
        </Link>
        <Link href="/profile" className="text-sm text-[var(--color-text-secondary)] hover:text-white">Back to Profile Hub</Link>
      </nav>

      <main className="max-w-3xl mx-auto animate-fade-in space-y-8">
        <div className="glass-card p-8 border-t-4 border-t-[var(--color-accent-purple)]">
          <h1 className="text-2xl font-bold text-white mb-2">Technical Skill Simulator</h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Words on a resume mean nothing. Prove it. Enter a skill you want to verify, and the AI will generate a micro-assessment for you.
          </p>

          <div className="flex gap-4 mb-6">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="E.g., React.js, Python Data Analysis, B2B Copywriting" 
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              disabled={isGenerating || !!challenge}
            />
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || !!challenge || !targetSkill}
              className="btn-primary"
            >
              {isGenerating ? 'Generating...' : 'Start Assessment'}
            </button>
          </div>
        </div>

        {challenge && !evaluation && (
          <div className="glass-card p-8 animate-slide-up border-l-4 border-l-[var(--color-accent-blue)]">
            <h2 className="text-xl font-bold text-white mb-2">{challenge.title}</h2>
            <p className="text-[var(--color-text-secondary)] mb-6 whitespace-pre-wrap">{challenge.description}</p>
            
            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border-medium)] mb-6">
              <h3 className="text-sm font-bold text-white mb-2">Evaluation Criteria:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-text-secondary)]">
                {challenge.evaluationCriteria.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <h3 className="text-sm font-bold text-white mb-3">Your Submission ({challenge.expectedFormat}):</h3>
            <textarea 
              className="input-field min-h-[200px] font-mono text-sm mb-4"
              placeholder="Paste your code, text, or link here..."
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              disabled={isEvaluating}
            />

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setChallenge(null)} 
                className="btn-secondary"
                disabled={isEvaluating}
              >
                Cancel
              </button>
              <button 
                onClick={handleEvaluate} 
                className="btn-primary"
                disabled={isEvaluating || !submission}
              >
                {isEvaluating ? 'Evaluating...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        )}

        {evaluation && (
          <div className={`glass-card p-8 animate-slide-up border-l-4 ${evaluation.passed ? 'border-l-[var(--color-success)]' : 'border-l-[var(--color-error)]'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${evaluation.passed ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'}`}>
                {evaluation.passed ? '✓' : '✗'}
              </div>
              <h2 className="text-xl font-bold text-white">
                {evaluation.passed ? 'Assessment Passed!' : 'Assessment Failed'}
              </h2>
            </div>
            
            <div className="text-3xl font-mono font-bold text-white mb-6">Score: {evaluation.score}/100</div>

            <h3 className="text-sm font-bold text-white mb-2">Reviewer Feedback:</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 whitespace-pre-wrap">{evaluation.feedback}</p>

            {evaluation.passed ? (
              <div className="bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] p-4 rounded-lg">
                <p className="text-sm text-[var(--color-success)] font-bold mb-1">Badge Awarded: Verified {targetSkill}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">This has been permanently added to your Proof-of-Work graph.</p>
              </div>
            ) : (
              <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] p-4 rounded-lg">
                <p className="text-sm text-[var(--color-error)] font-bold mb-1">Keep Practicing</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Review the feedback and try again when you are ready.</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => {
                  setChallenge(null);
                  setEvaluation(null);
                  setSubmission('');
                  setTargetSkill('');
                }} 
                className="btn-primary"
              >
                Run Another Simulator
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
