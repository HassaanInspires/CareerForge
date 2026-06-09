'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadUserSettings, saveUserSettings } from '@/app/actions/memory';

export default function SettingsPage() {
  const [activeProvider, setActiveProvider] = useState('anthropic');
  const [keys, setKeys] = useState<{ [key: string]: string }>({});
  const [selectedModels, setSelectedModels] = useState<{ [key: string]: string }>({});
  const [availableModels, setAvailableModels] = useState<{ [key: string]: { id: string; name: string }[] }>({});
  const [isFetching, setIsFetching] = useState<{ [key: string]: boolean }>({});
  const [saved, setSaved] = useState(false);
  const [realism, setRealism] = useState('brutal');
  const [tavilyKey, setTavilyKey] = useState('');

  const providers = [
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'groq', name: 'Groq' },
    { id: 'mistral', name: 'Mistral' },
  ];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await loadUserSettings();
        if (dbSettings) {
          setActiveProvider(dbSettings.activeProvider);
          setRealism(dbSettings.aiRealism);
          setTavilyKey(dbSettings.tavilyKey);
          setKeys(dbSettings.apiKeys || {});
          setSelectedModels(dbSettings.selectedModels || {});

          // Fetch models for active/loaded keys
          Object.entries(dbSettings.apiKeys || {}).forEach(([providerId, key]) => {
            if (key) {
              fetchModels(providerId, key);
            }
          });
        } else {
          // Fallback to local storage
          const savedProvider = localStorage.getItem('cf_provider');
          if (savedProvider) setActiveProvider(savedProvider);

          const savedRealism = localStorage.getItem('cf_ai_realism');
          if (savedRealism) setRealism(savedRealism);

          const savedTavily = localStorage.getItem('cf_tavily_key') || '';
          setTavilyKey(savedTavily);

          const loadedKeys: { [key: string]: string } = {};
          const loadedModels: { [key: string]: string } = {};
          
          providers.forEach(p => {
            const key = localStorage.getItem(`cf_key_${p.id}`);
            if (key) loadedKeys[p.id] = key;
            
            const model = localStorage.getItem(`cf_model_${p.id}`);
            if (model) loadedModels[p.id] = model;
          });
          
          setKeys(loadedKeys);
          setSelectedModels(loadedModels);

          Object.keys(loadedKeys).forEach(providerId => {
            if (loadedKeys[providerId]) {
              fetchModels(providerId, loadedKeys[providerId]);
            }
          });
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      }
    };

    loadSettings();
  }, []);

  const fetchModels = async (providerId: string, apiKey: string) => {
    if (!apiKey) return;
    
    setIsFetching(prev => ({ ...prev, [providerId]: true }));
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId, apiKey }),
      });
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setAvailableModels(prev => ({ ...prev, [providerId]: data.models }));
        
        // Auto-select first model if none selected
        setSelectedModels(prev => {
          if (!prev[providerId] || !data.models.find((m: any) => m.id === prev[providerId])) {
            return { ...prev, [providerId]: data.models[0].id };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(`Failed to fetch models for ${providerId}`, err);
    } finally {
      setIsFetching(prev => ({ ...prev, [providerId]: false }));
    }
  };

  const handleKeyBlur = (providerId: string) => {
    if (keys[providerId]) {
      fetchModels(providerId, keys[providerId]);
    }
  };

  const handleSave = async () => {
    try {
      await saveUserSettings({
        apiKeys: keys,
        selectedModels,
        activeProvider,
        aiRealism: realism,
        tavilyKey
      });

      // Local storage sync for backup / offline support
      localStorage.setItem('cf_provider', activeProvider);
      localStorage.setItem('cf_ai_realism', realism);
      localStorage.setItem('cf_tavily_key', tavilyKey);
      Object.entries(keys).forEach(([provider, key]) => {
        localStorage.setItem(`cf_key_${provider}`, key);
      });
      Object.entries(selectedModels).forEach(([provider, model]) => {
        localStorage.setItem(`cf_model_${provider}`, model);
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-black text-white">
              Forge <span className="text-[var(--color-accent-blue)]">Settings</span>
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-2">Manage your AI integrations and preferences locally.</p>
          </div>
          <Link href="/builder" className="btn-primary">
            Back to Builder
          </Link>
        </header>

        <div className="glass-card p-8">
          <h2 className="text-xl font-heading font-bold text-white mb-6">AI Coaching Personality</h2>
          <p className="text-sm text-[var(--color-text-disabled)] mb-6">
            Configure how direct and critical the AI should be when evaluating your profile and generating assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setRealism('brutal')}
              className={`flex-1 py-4 px-4 rounded-xl border text-left transition-all duration-200 ${
                realism === 'brutal'
                  ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.05)] text-white shadow-[0_0_15px_rgba(0,212,255,0.05)]'
                  : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)]'
              }`}
            >
              <div className="font-bold text-sm mb-1 text-[var(--color-accent-blue)]">⚡ Brutal Realism (Default)</div>
              <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                The AI will be brutally honest, calling out gaps directly, exposing deficiencies, and identifying exactly what roles you qualify and do not qualify for.
              </div>
            </button>
            <button
              onClick={() => setRealism('supportive')}
              className={`flex-1 py-4 px-4 rounded-xl border text-left transition-all duration-200 ${
                realism === 'supportive'
                  ? 'border-[var(--color-accent-purple)] bg-[rgba(143,0,255,0.05)] text-white shadow-[0_0_15px_rgba(143,0,255,0.05)]'
                  : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-purple)]'
              }`}
            >
              <div className="font-bold text-sm mb-1 text-[var(--color-accent-purple)]">🌱 Supportive Coaching</div>
              <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                The AI will frame credentials positively, focusing on transferrable skills, and offer encouraging feedback.
              </div>
            </button>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-heading font-bold text-white mb-6">Default AI Provider</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`py-3 px-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  activeProvider === p.id
                    ? 'border-[var(--color-accent-blue)] bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                    : 'border-[var(--color-border-medium)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-accent-blue)] hover:text-white hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-heading font-bold text-white mb-6">API Keys & Models</h2>
          <p className="text-sm text-[var(--color-text-disabled)] mb-6">
            Keys are stored securely in your browser's local storage. Models will be fetched automatically once a valid API key is entered.
          </p>

          <div className="space-y-6">
            {providers.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.02)]">
                <label className="sm:w-1/4 font-medium text-[var(--color-text-secondary)] pt-2">{p.name}</label>
                <div className="sm:w-3/4 space-y-3">
                  <input
                    type="password"
                    placeholder={`API Key (sk-...)`}
                    className="input-field w-full"
                    value={keys[p.id] || ''}
                    onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })}
                    onBlur={() => handleKeyBlur(p.id)}
                  />
                  <div className="relative">
                    <select
                      className="input-field w-full appearance-none pr-10"
                      value={selectedModels[p.id] || ''}
                      onChange={(e) => setSelectedModels({ ...selectedModels, [p.id]: e.target.value })}
                      disabled={isFetching[p.id] || !availableModels[p.id] || availableModels[p.id].length === 0}
                    >
                      {(!availableModels[p.id] || availableModels[p.id].length === 0) ? (
                        <option value="">{isFetching[p.id] ? 'Fetching models...' : 'Enter API key to fetch models'}</option>
                      ) : (
                        availableModels[p.id].map(m => (
                          <option key={m.id} value={m.id} className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
                            {m.name}
                          </option>
                        ))
                      )}
                    </select>
                    {isFetching[p.id] && (
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <div className="animate-spin-slow rounded-full h-4 w-4 border-b-2 border-t-2 border-[var(--color-accent-blue)]"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 animate-fade-in">
          <h2 className="text-xl font-heading font-bold text-white mb-2">Deep Search Integrations</h2>
          <p className="text-sm text-[var(--color-text-disabled)] mb-6">
            Input search API keys to crawl Freelancer platforms (Upwork, Fiverr, Freelancer), LinkedIn, and official company job pages.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.02)]">
            <div className="sm:w-1/4 pt-2">
              <label className="font-medium text-[var(--color-text-secondary)]">Tavily API Key</label>
              <span className="block text-[10px] text-[var(--color-text-disabled)] mt-1">Get free key at <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">tavily.com</a></span>
            </div>
            <div className="sm:w-3/4">
              <input
                type="password"
                placeholder="Tavily API Key (tvly-...)"
                className="input-field w-full"
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
              />
              <span className="block text-[11px] text-[var(--color-accent-orange)] mt-2">
                💡 <strong>Note:</strong> If no Tavily key is configured, search agents will automatically fall back to the built-in free DuckDuckGo scraper.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave} 
            className="btn-primary px-8 py-3 text-lg relative"
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </main>
  );
}
