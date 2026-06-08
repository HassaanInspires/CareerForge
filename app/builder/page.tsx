'use client';

import React, { useState } from 'react';
import StepOne from '@/components/StepOne';
import StepTwo from '@/components/StepTwo';
import StepThree from '@/components/StepThree';
import StepFour from '@/components/StepFour';
import ResultsPanel from '@/components/ResultsPanel';
import { Provider, OptimizeResponse } from '@/lib/types';
import { CandidateMemory, defaultMemory } from '@/lib/memory';

export default function Home() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    resumeBase64: '',
    resumeFileName: '',
    jobDescription: '',
    memory: defaultMemory as CandidateMemory,
    preferences: {
      tone: 'professional',
      length: 'standard',
      focus: 'skills',
    } as any, // Will cast properly later
    outputOptions: [] as string[],
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleStepOne = (data: { resumeBase64: string; fileName: string }) => {
    setFormData((prev) => ({ ...prev, resumeBase64: data.resumeBase64, resumeFileName: data.fileName }));
    nextStep();
  };

  const handleStepTwo = (jobDescription: string) => {
    setFormData((prev) => ({ ...prev, jobDescription }));
    nextStep();
  };

  const handleStepThree = (memory: CandidateMemory) => {
    setFormData((prev) => ({ ...prev, memory }));
    nextStep();
  };

  const handleStepFour = async (data: { preferences: any; outputOptions: string[] }) => {
    setFormData((prev) => ({ ...prev, preferences: data.preferences, outputOptions: data.outputOptions }));
    nextStep(); // Move to Step 5 (Loading State)

    const provider = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
    const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
    const model = localStorage.getItem(`cf_model_${provider}`) || '';

    handleGenerate({ provider, model, apiKey });
  };

  const handleGenerate = async (config: { provider: Provider; model: string; apiKey: string }) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeBase64: formData.resumeBase64,
          resumeFileName: formData.resumeFileName,
          jobDescription: formData.jobDescription,
          provider: config.provider,
          model: config.model,
          userApiKey: config.apiKey,
          memory: formData.memory,
          preferences: formData.preferences,
          // outputOptions could be added to payload if backend handles it
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize resume');
      }

      setResult(data);
      setStep(6); // Move to results
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setError(null);
    setFormData({
      resumeBase64: '',
      resumeFileName: '',
      jobDescription: '',
      memory: defaultMemory as CandidateMemory,
      preferences: {
        tone: 'professional',
        length: 'standard',
        focus: 'skills',
      } as any,
      outputOptions: [],
    });
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center btn-primary p-0">
              <span className="text-white font-heading font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-heading font-black text-white tracking-tight">
              Career<span style={{ color: "var(--color-accent-blue)" }}>Forge</span>
            </h1>
          </div>
          {step <= 4 && (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-[var(--color-text-secondary)] text-sm font-medium">Step {step} of 4</span>
              <div className="w-32 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ width: `${(step / 4) * 100}%`, backgroundColor: 'var(--color-accent-blue)' }}
                ></div>
              </div>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="glass-card min-h-[500px] animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 md:p-6">
            {step === 1 && (
              <StepOne onNext={handleStepOne} onError={setError} />
            )}
            {step === 2 && (
              <StepTwo 
                currentData={formData.jobDescription} 
                onNext={handleStepTwo} 
                onBack={prevStep} 
              />
            )}
            {step === 3 && (
              <StepThree 
                currentMemory={formData.memory} 
                resumeBase64={formData.resumeBase64}
                jobDescription={formData.jobDescription}
                onNext={handleStepThree} 
                onBack={prevStep} 
              />
            )}
            {step === 4 && (
              <StepFour 
                currentPreferences={formData.preferences} 
                currentOutputOptions={formData.outputOptions}
                onNext={handleStepFour} 
                onBack={prevStep} 
              />
            )}
            {step === 5 && !result && (
              <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-[var(--color-bg-tertiary)]"></div>
                  <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-t-[var(--color-accent-blue)] border-r-[var(--color-accent-purple)] border-b-transparent border-l-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
                <h3 className="text-xl font-heading font-bold text-white mb-2">Analyzing your profile...</h3>
                <p className="text-[var(--color-text-secondary)]">Extracting deep AI insights and precision scoring.</p>
                {error && (
                  <div className="mt-6 p-4 bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] rounded-xl animate-pop-in">
                    <p className="text-[var(--color-error)] text-sm">{error}</p>
                    <button onClick={() => setStep(4)} className="mt-3 text-[var(--color-accent-blue)] hover:text-white underline text-sm transition-colors">Go back</button>
                  </div>
                )}
              </div>
            )}
            {step === 6 && result && (
              <div className="animate-bounce-in">
                <ResultsPanel result={result} onReset={reset} />
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-8 text-center text-[var(--color-text-disabled)] text-xs animate-fade-in">
          <p>© 2026 CareerForge AI. Powered by Anthropic, OpenAI & Google.</p>
        </footer>
      </div>
    </main>
  );
}
