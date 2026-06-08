'use client';

import React, { useState, useEffect } from 'react';
import { Provider } from '@/lib/types';

interface StepFiveProps {
  onGenerate: (data: { provider: Provider; model: string; apiKey: string }) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function StepFive({ onGenerate, onBack, isLoading, error }: StepFiveProps) {
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const providers: { id: Provider; name: string }[] = [
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'groq', name: 'Groq' },
    { id: 'mistral', name: 'Mistral' },
  ];

  useEffect(() => {
    const fetchModels = async () => {
      if (!provider) return;
      setIsFetchingModels(true);
      try {
        const response = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey }),
        });
        const data = await response.json();
        if (data.models) {
          setAvailableModels(data.models);
          if (data.models.length > 0) {
            // Only set default model if current model is not in the new list
            if (!data.models.find((m: any) => m.id === model)) {
              setModel(data.models[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch models', err);
      } finally {
        setIsFetchingModels(false);
      }
    };

    const timeoutId = setTimeout(fetchModels, 500);
    return () => clearTimeout(timeoutId);
  }, [provider, apiKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ provider, model, apiKey });
  };

  return (
    <div className="space-y-6 animate-fade-in animate-slide-in-left">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">AI Configuration</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Choose your preferred AI model to perform the optimization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Provider</label>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`flex items-center justify-center rounded-xl border py-2 px-3 text-xs font-semibold uppercase sm:flex-1 transition-all duration-200 ${
                  provider === p.id
                    ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                    : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            API Key (Optional if set on server)
          </label>
          <input
            type="password"
            id="api-key"
            className="input-field"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Select Model
          </label>
          <div className="relative">
            <select
              id="model"
              className="input-field appearance-none cursor-pointer"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isFetchingModels || availableModels.length === 0}
            >
              {availableModels.length === 0 && !isFetchingModels ? (
                <option value="">No models available</option>
              ) : (
                availableModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
                    {m.name}
                  </option>
                ))
              )}
            </select>
            {isFetchingModels && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <div className="animate-spin-slow rounded-full h-4 w-4 border-b-2 border-t-2 border-[var(--color-accent-blue)]"></div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] p-4 animate-pop-in">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[var(--color-error)]">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[var(--color-border-medium)] bg-transparent py-3 px-4 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading || (!model && !isFetchingModels && availableModels.length > 0)}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin-slow rounded-full h-4 w-4 border-b-2 border-t-2 border-white mr-2"></div>
                Optimizing...
              </>
            ) : (
              'Generate Resume'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
