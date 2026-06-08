'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CandidateMemory, 
  loadMemoryFromLocal, 
  saveMemoryToLocal, 
  defaultMemory, 
  RESUME_STORAGE_KEY 
} from '@/lib/memory';
import { Provider } from '@/lib/types';

export default function ProfileHub() {
  const [memory, setMemory] = useState<CandidateMemory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: 'Hello! I am your Memory Manager. Want to add any recent achievements or clarify your career goals?' }
  ]);

  useEffect(() => {
    const mem = loadMemoryFromLocal();
    setMemory(mem);
    const res = localStorage.getItem(RESUME_STORAGE_KEY);
    if (res) setHasResume(true);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (file.type !== 'application/pdf' && extension !== 'pdf') {
      setError('Only PDF files are supported.');
      return;
    }

    setIsUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        localStorage.setItem(RESUME_STORAGE_KEY, base64);
        setHasResume(true);

        const provider = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
        const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
        const model = localStorage.getItem(`cf_model_${provider}`) || '';

        const res = await fetch('/api/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeBase64: base64,
            resumeFileName: file.name,
            provider,
            model,
            userApiKey: apiKey
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        saveMemoryToLocal(data.memory);
        setMemory(data.memory);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatLog(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const provider = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
      const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
      const model = localStorage.getItem(`cf_model_${provider}`) || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatLog, { role: 'user', content: userMsg }],
          resumeBase64: localStorage.getItem(RESUME_STORAGE_KEY),
          jobDescription: 'Updating Candidate Profile without a specific job description yet.',
          memory: memory,
          provider,
          model,
          userApiKey: apiKey
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.memory) {
        setMemory(data.memory);
        saveMemoryToLocal(data.memory);
      }

      setChatLog(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { role: 'ai', content: 'Error: ' + err.message }]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetProfile = () => {
    localStorage.removeItem(RESUME_STORAGE_KEY);
    saveMemoryToLocal(defaultMemory);
    setHasResume(false);
    setMemory(defaultMemory);
    setChatLog([{ role: 'ai', content: 'Hello! Please upload a new CV to begin.' }]);
  };

  if (!memory) return null;

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center gap-2">
            <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center btn-primary p-0">
              <span className="text-white font-heading font-bold text-xl">C</span>
            </Link>
            <h1 className="text-2xl font-heading font-black text-white tracking-tight">
              Candidate <span className="text-[var(--color-accent-blue)]">Hub</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/builder" className="btn-primary py-2 px-4 text-sm">Open Builder</Link>
          </div>
        </header>

        {!hasResume ? (
          <div className="glass-card p-12 text-center animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-4">Upload Your Master CV</h2>
            <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
              Upload your resume once. Our AI will analyze it to build your permanent Candidate Memory Graph. You'll never need to upload it again.
            </p>
            <div>
              <input 
                type="file" 
                id="profile-cv-upload"
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="hidden"
                disabled={isUploading}
              />
              <button 
                type="button"
                onClick={() => document.getElementById('profile-cv-upload')?.click()}
                className="btn-primary" 
                disabled={isUploading}
              >
                {isUploading ? 'Extracting Memory Graph...' : 'Select PDF File'}
              </button>
            </div>
            {error && <p className="text-[var(--color-error)] mt-4">{error}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            
            {/* Long-Term Memory Visualizer */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-blue)]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Long-Term Memory Graph</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Your permanent career data. Extracted automatically.</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-medium)]">
                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">Level: <span className="text-white">{memory.careerLevel}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Core Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {memory.coreSkills.length > 0 ? memory.coreSkills.map((s, i) => (
                        <span key={i} className="badge">{s}</span>
                      )) : <span className="text-sm text-[var(--color-text-disabled)]">No skills extracted yet.</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Verifiable Metrics</h3>
                    <ul className="space-y-2">
                      {memory.verifiableMetrics.length > 0 ? memory.verifiableMetrics.map((m, i) => (
                        <li key={i} className="text-sm text-white flex items-start gap-2">
                          <span className="text-[var(--color-success)] mt-0.5">✓</span>
                          <span>{m}</span>
                        </li>
                      )) : <li className="text-sm text-[var(--color-text-disabled)]">No metrics extracted yet.</li>}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-[var(--color-border-medium)]">
                  <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Career Goals</h3>
                  <p className="text-sm text-white bg-[var(--color-bg-tertiary)] p-3 rounded">{memory.careerGoals || "Not defined. Tell the Memory Manager your goals!"}</p>
                </div>
              </div>

              <div className="flex justify-end">
                 <button onClick={resetProfile} className="text-xs text-[var(--color-error)] hover:underline">
                   Delete Profile & Start Over
                 </button>
              </div>
            </div>

            {/* Short-Term Memory / Chat */}
            <div className="glass-card flex flex-col h-[600px]">
              <div className="p-4 border-b border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)]">
                <h2 className="text-lg font-bold text-white">Memory Manager</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">Chat to update your profile</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`text-sm p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-[var(--color-text-primary)] text-black' : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-medium)] text-[var(--color-text-primary)]'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-[var(--color-text-secondary)] animate-pulse">Memory Manager is thinking...</div>}
              </div>
              <div className="p-4 border-t border-[var(--color-border-medium)]">
                <form onSubmit={handleChat} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    placeholder="E.g. I just got my AWS cert..."
                    className="input-field text-sm flex-1"
                  />
                  <button type="submit" className="btn-primary py-1 px-3" disabled={!chatInput.trim() || isTyping}>Send</button>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
