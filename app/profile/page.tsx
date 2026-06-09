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
import { 
  loadUserMemory, 
  saveUserMemory, 
  loadUserHistory, 
  loadUserChatLog, 
  saveUserChatLog,
  loadUserSettings,
  deleteUserResume
} from '@/app/actions/memory';
import { useSession } from 'next-auth/react';

export default function ProfileHub() {
  const { data: session, status } = useSession();
  const [memory, setMemory] = useState<CandidateMemory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [hasResume, setHasResume] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: 'Hello! I am your Memory Manager. Want to add any recent achievements or clarify your career goals?' }
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [realism, setRealism] = useState<'supportive' | 'brutal'>('brutal');

  // V5.0 Pivot: PoW States
  const [githubUser, setGithubUser] = useState('');
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [hasKeys, setHasKeys] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const initProfile = async () => {
      const mem = await loadUserMemory();
      if (mem) {
        setMemory(mem);
        setHasResume(!!mem.resumeFileName);
      } else {
        setMemory(defaultMemory);
        setHasResume(false);
      }

      const dbChat = await loadUserChatLog();
      if (dbChat && dbChat.length > 0) {
        setChatLog(dbChat);
      }

      const dbHistory = await loadUserHistory();
      if (dbHistory) {
        setHistory(dbHistory);
      }

      // Load keys state from DB settings
      const settings = await loadUserSettings();
      if (settings) {
        const provider = settings.activeProvider;
        const apiKey = settings.apiKeys[provider] || '';
        setHasKeys(!!apiKey);
        setRealism((settings.aiRealism as 'supportive' | 'brutal') || 'brutal');
      } else {
        const provider = localStorage.getItem('cf_provider') || 'anthropic';
        const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
        setHasKeys(!!apiKey);
        const savedRealism = localStorage.getItem('cf_ai_realism') as 'supportive' | 'brutal';
        if (savedRealism) setRealism(savedRealism);
      }
    };
    initProfile();
  }, [status]);

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
            userApiKey: apiKey,
            realism // V4.0 Addition
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        await saveUserMemory(data.memory);
        setMemory(data.memory);
        const welcomeLog = [{ role: 'ai' as const, content: 'Hello! I have analyzed your CV and initialized your career memory graph. What would you like to discuss or refine?' }];
        setChatLog(welcomeLog);
        await saveUserChatLog(welcomeLog);
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
    
    const nextChatLog = [...chatLog, { role: 'user' as const, content: userMsg }];
    setChatLog(nextChatLog);
    setIsTyping(true);

    try {
      await saveUserChatLog(nextChatLog);

      const provider = (localStorage.getItem('cf_provider') as Provider) || 'anthropic';
      const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
      const model = localStorage.getItem(`cf_model_${provider}`) || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextChatLog,
          jobDescription: 'Updating Candidate Profile without a specific job description yet.',
          memory: memory,
          provider,
          model,
          userApiKey: apiKey,
          realism // V4.0 Addition
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.memory) {
        setMemory(data.memory);
        await saveUserMemory(data.memory);
      }

      const finalChatLog = [...nextChatLog, { role: 'ai' as const, content: data.response }];
      setChatLog(finalChatLog);
      await saveUserChatLog(finalChatLog);
    } catch (err: any) {
      const errorChatLog = [...nextChatLog, { role: 'ai' as const, content: 'Error: ' + err.message }];
      setChatLog(errorChatLog);
      await saveUserChatLog(errorChatLog);
    } finally {
      setIsTyping(false);
    }
  };

  const resetProfile = async () => {
    if (!confirm('Are you sure you want to delete your CV, memory profile, and optimization history? This action is permanent.')) return;
    setIsUploading(true);
    try {
      await deleteUserResume();
      localStorage.removeItem(RESUME_STORAGE_KEY);
      const welcomeLog = [{ role: 'ai' as const, content: 'Hello! Please upload a new CV to begin.' }];
      setHasResume(false);
      setMemory(defaultMemory);
      setChatLog(welcomeLog);
      setHistory([]);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadResume = () => {
    if (!memory?.resumeBase64) {
      alert("No active CV/Resume content found to download.");
      return;
    }
    try {
      const base64Content = memory.resumeBase64;
      const binaryString = window.atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = memory.resumeFileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to download CV: " + err.message);
    }
  };

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUser.trim()) return;
    setIsFetchingGithub(true);
    setGithubError('');
    try {
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: githubUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const newMemory = { ...memory!, proofOfWork: [...(memory?.proofOfWork || []), ...data.proofOfWork] };
      setMemory(newMemory);
      await saveUserMemory(newMemory);
      setGithubUser('');
    } catch (err: any) {
      setGithubError(err.message);
    } finally {
      setIsFetchingGithub(false);
    }
  };

  if (!memory) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col">
      <div className="w-full">
        <header className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center gap-2">
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
            {!hasKeys && (
              <div className="mb-6 p-4 rounded bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] text-[var(--color-error)] text-sm max-w-md mx-auto">
                ⚠️ <strong>API Key Required:</strong> Please configure your AI Provider and API key in the <a href="/settings" className="underline font-bold hover:text-white">Settings</a> page first. The AI cannot extract memory details from your CV without an active key.
              </div>
            )}
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
              
              {/* Active Master Resume Card */}
              <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-blue)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Active Master Resume</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                      {memory.resumeFileName || 'resume.pdf'}
                    </p>
                    {memory.resumeUploadedAt && (
                      <p className="text-[10px] text-[var(--color-text-disabled)] mt-0.5">
                        Uploaded on {new Date(memory.resumeUploadedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleDownloadResume}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-mono"
                  >
                    Download PDF
                  </button>
                  <button 
                    onClick={() => document.getElementById('profile-cv-replace-upload')?.click()}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-mono"
                    disabled={isUploading}
                  >
                    Replace CV
                  </button>
                  <button 
                    onClick={resetProfile}
                    className="btn-secondary py-1.5 px-3 text-xs border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 flex items-center gap-1.5 font-mono"
                    disabled={isUploading}
                  >
                    Delete
                  </button>
                  <input 
                    type="file" 
                    id="profile-cv-replace-upload"
                    accept=".pdf" 
                    onChange={handleFileUpload} 
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </div>

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

              {/* Verified Proof of Work (V5.0) */}
              <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-purple)]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Verified Proof of Work</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">Public evidence of your capabilities.</p>
                  </div>
                </div>

                {memory.proofOfWork && memory.proofOfWork.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {memory.proofOfWork.map((pow) => (
                      <div key={pow.id} className="p-4 rounded-xl border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-[rgba(143,0,255,0.1)] text-[var(--color-accent-purple)] border border-[var(--color-accent-purple)]">
                            {pow.type.replace('_', ' ')}
                          </span>
                          {pow.metrics?.language && <span className="text-xs text-[var(--color-text-secondary)] font-mono">{pow.metrics.language}</span>}
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate mb-1">
                          <a href={pow.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[var(--color-accent-blue)]">{pow.title}</a>
                        </h4>
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3">{pow.description}</p>
                        <div className="flex gap-3 text-xs font-mono text-[var(--color-text-disabled)]">
                          {pow.metrics?.stars !== undefined && <span>⭐ {pow.metrics.stars}</span>}
                          {pow.metrics?.forks !== undefined && <span>🍴 {pow.metrics.forks}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-disabled)] italic text-center py-6 bg-[rgba(255,255,255,0.01)] rounded-xl border border-dashed border-[var(--color-border-light)] mb-6">
                    No verified work attached yet. Connect your accounts to build trust.
                  </p>
                )}

                <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border-medium)]">
                  <h4 className="text-sm font-bold text-white mb-2">Connect GitHub</h4>
                  <form onSubmit={handleConnectGithub} className="flex gap-2">
                    <input 
                      type="text" 
                      value={githubUser}
                      onChange={(e) => setGithubUser(e.target.value)}
                      placeholder="Enter GitHub Username" 
                      className="input-field text-sm"
                      disabled={isFetchingGithub}
                    />
                    <button type="submit" disabled={isFetchingGithub || !githubUser} className="btn-secondary py-1 px-4 whitespace-nowrap">
                      {isFetchingGithub ? 'Connecting...' : 'Fetch Repos'}
                    </button>
                  </form>
                  {githubError && <p className="text-xs text-[var(--color-error)] mt-2">{githubError}</p>}
                </div>
              </div>

              {/* Session History Archive */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-2">Optimization History Archive</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">Historical reports and optimized resume builds generated on this device.</p>
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${item.path === 'A' ? 'bg-[rgba(0,212,255,0.1)] text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]' : 'bg-[rgba(143,0,255,0.1)] text-[var(--color-accent-purple)] border border-[var(--color-accent-purple)]'}`}>
                              {item.path === 'A' ? 'Job Target' : 'Assessment'}
                            </span>
                            <span className="text-xs text-[var(--color-text-disabled)] ml-3 font-mono">{item.timestamp}</span>
                          </div>
                          <span className="text-sm font-bold text-white bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded border border-[var(--color-border-medium)]">
                            Score: {item.score}%
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate mb-1">{item.title}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mb-3">{item.summary}</p>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedHistoryItem(selectedHistoryItem?.id === item.id ? null : item)}
                            className="text-xs font-semibold text-[var(--color-accent-blue)] hover:underline"
                          >
                            {selectedHistoryItem?.id === item.id ? 'Hide Content' : 'View Content'}
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(item.output);
                              alert("Copied to clipboard!");
                            }}
                            className="text-xs font-semibold text-[var(--color-text-disabled)] hover:text-white transition-colors"
                          >
                            Copy Output
                          </button>
                        </div>

                        {selectedHistoryItem?.id === item.id && (
                          <div className="mt-4 p-4 bg-black/40 rounded border border-[var(--color-border-medium)] overflow-x-auto max-h-[300px]">
                            <pre className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap font-mono leading-relaxed">
                              {item.output}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-disabled)] italic text-center py-4 bg-[rgba(255,255,255,0.01)] rounded-xl border border-dashed border-[var(--color-border-light)]">
                    No history items available yet. Generate an assessment or optimized resume to see it here!
                  </p>
                )}
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
    </div>
  );
}
