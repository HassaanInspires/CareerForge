'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Provider } from '@/lib/types';

interface Job {
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  isRemote: boolean;
  fitScore: number;
  trustScore: number;
  trustExplanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  remoteType: string;
}

export default function JobAgentPage() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Remote');
  const [depth, setDepth] = useState<'quick' | 'deep'>('quick');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKeys, setHasKeys] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  useEffect(() => {
    const provider = localStorage.getItem('cf_provider') || 'anthropic';
    const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
    setHasKeys(!!apiKey);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKeys) {
      setError('Please set up your AI Provider and API key in settings before conducting job searches.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const provider = localStorage.getItem('cf_provider') as Provider || 'anthropic';
    const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
    const model = localStorage.getItem(`cf_model_${provider}`) || '';

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location,
          depth,
          provider,
          model,
          userApiKey: apiKey
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search jobs');

      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[var(--color-success)] border-[var(--color-success)]';
    if (score >= 50) return 'text-[var(--color-accent-orange)] border-[var(--color-accent-orange)]';
    return 'text-[var(--color-error)] border-[var(--color-error)]';
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-6 md:p-12 font-sans text-white">
      <nav className="mb-8 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="logo-box flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-purple)]">
            <span className="text-white font-heading font-bold text-xl">C</span>
          </Link>
          <h1 className="text-2xl font-heading font-black text-white tracking-tight">
            Job Hunt <span className="text-[var(--color-accent-purple)]">Agent</span>
          </h1>
        </div>
        <Link href="/profile" className="text-sm text-[var(--color-text-secondary)] hover:text-white">
          Back to Hub
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Search Parameter Dashboard */}
        <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-purple)]">
          <h2 className="text-lg font-bold text-white mb-2">Configure Job Hunt Crawler</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            The AI Agent aggregates remote and European hybrid listings, queries live feeds, and tests company authenticity and skills compatibility against your profile memory in real time.
          </p>

          {!hasKeys && (
            <div className="mb-6 p-4 rounded bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] text-[var(--color-error)] text-sm">
              ⚠️ <strong>Action Required:</strong> You must configure your AI keys in <Link href="/settings" className="underline font-bold hover:text-white">Settings</Link> first. Search engines and match rankings cannot run without an active provider.
            </div>
          )}

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Job Title / Keywords</label>
              <input
                type="text"
                placeholder="e.g. Next.js, Developer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field w-full text-sm py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Location Preferential</label>
              <input
                type="text"
                placeholder="e.g. Remote, Europe"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field w-full text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Search Depth</label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value as any)}
                className="input-field w-full text-sm py-2"
              >
                <option value="quick">Quick Match (6 listings)</option>
                <option value="deep">Deep Agentic Scan (12 listings)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading || !hasKeys}
                className="btn-primary w-full py-2.5 font-bold text-sm tracking-wide bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] hover:opacity-90"
              >
                {isLoading ? 'Crawling & Rating...' : 'Execute Agent Search'}
              </button>
            </div>
          </form>
          {error && <p className="text-[var(--color-error)] mt-4 text-sm">{error}</p>}
        </div>

        {/* Results Stream */}
        {isLoading ? (
          <div className="text-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-purple)] mx-auto"></div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Contacting public feeds, parsing descriptions, checking company trust levels and matching your skills graph...
            </p>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">Active Verified Openings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job, idx) => (
                <div key={idx} className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-[var(--color-accent-blue)] hover:border-l-[var(--color-accent-purple)] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-0.5">{job.title}</h4>
                        <p className="text-sm text-[var(--color-text-secondary)]">{job.company}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)]">
                          {job.remoteType}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)]">
                          {job.location}
                        </span>
                      </div>
                    </div>

                    {/* Scores Section */}
                    <div className="grid grid-cols-2 gap-4 my-4 p-3 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border-light)]">
                      <div className="text-center border-r border-[var(--color-border-light)]">
                        <span className="block text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Match Fit</span>
                        <span className={`text-xl font-bold px-2 py-0.5 rounded border ${getScoreColor(job.fitScore)}`}>
                          {job.fitScore}%
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Company Trust</span>
                        <span className={`text-xl font-bold px-2 py-0.5 rounded border ${getScoreColor(job.trustScore)}`}>
                          {job.trustScore}%
                        </span>
                      </div>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 mb-4">
                      {job.description}
                    </p>

                    {/* Trust Explanation */}
                    <div className="text-xs p-2.5 rounded bg-[rgba(235,166,90,0.05)] border border-[rgba(235,166,90,0.15)] text-[var(--color-accent-orange)] mb-4">
                      <strong>AI Trust Audit:</strong> {job.trustExplanation}
                    </div>

                    {/* Skills alignment */}
                    <div className="space-y-2 mb-6">
                      {job.matchedSkills.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">Matched Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {job.matchedSkills.map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(34,197,94,0.1)] text-[var(--color-success)] border border-[rgba(34,197,94,0.2)]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {job.missingSkills.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">Missing Requirements</span>
                          <div className="flex flex-wrap gap-1">
                            {job.missingSkills.map((s, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(239,68,68,0.1)] text-[var(--color-error)] border border-[rgba(239,68,68,0.2)]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border-light)]">
                      <span className="text-xs font-mono text-[var(--color-text-disabled)]">Offer: {job.salary}</span>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary py-1.5 px-4 text-xs font-bold bg-[var(--color-accent-blue)] text-white hover:opacity-90 flex items-center gap-1"
                      >
                        Apply & Verify Fit <span className="text-[var(--color-success)]">✓</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-[var(--color-text-secondary)]">
            <p className="italic">No crawlers running. Enter a search query above and execute search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
