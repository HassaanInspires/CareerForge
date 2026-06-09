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

  // Proposal Builder States
  const [proposalJob, setProposalJob] = useState<Job | null>(null);
  const [proposalData, setProposalData] = useState<{
    proposal: string;
    requiredAttachments: string[];
    salaryNegotiation: string;
    checklist: string[];
  } | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

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
    const tavilyKey = localStorage.getItem('cf_tavily_key') || '';

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
          userApiKey: apiKey,
          tavilyApiKey: tavilyKey
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

  const handleGenerateProposal = async (job: Job) => {
    setProposalJob(job);
    setIsGeneratingProposal(true);
    setProposalError(null);
    setProposalData(null);

    const provider = localStorage.getItem('cf_provider') || 'anthropic';
    const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
    const model = localStorage.getItem(`cf_model_${provider}`) || '';

    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          url: job.url,
          description: job.description,
          salary: job.salary,
          provider,
          model,
          userApiKey: apiKey
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate proposal');
      setProposalData(data);
    } catch (err: any) {
      setProposalError(err.message);
    } finally {
      setIsGeneratingProposal(false);
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
                    <div className="flex flex-col gap-2 pt-4 border-t border-[var(--color-border-light)]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-[var(--color-text-disabled)]">Offer: {job.salary}</span>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--color-accent-blue)] underline hover:text-white"
                        >
                          View Official Link ↗
                        </a>
                      </div>
                      <button
                        onClick={() => handleGenerateProposal(job)}
                        className="btn-primary py-2 px-4 text-xs font-bold bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] text-white hover:opacity-90 flex items-center justify-center gap-1 mt-2"
                      >
                        Generate Pitch & Proposal Strategy ⚡
                      </button>
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

      {/* Proposal Generator Modal */}
      {proposalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card max-w-3xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-[var(--color-border-medium)]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-heading font-black text-white">
                  Application Strategy & Pitch Builder
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Custom-tailored approach for {proposalJob.title} at {proposalJob.company}
                </p>
              </div>
              <button
                onClick={() => setProposalJob(null)}
                className="text-2xl text-[var(--color-text-disabled)] hover:text-white"
              >
                &times;
              </button>
            </div>

            {isGeneratingProposal ? (
              <div className="text-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-accent-blue)] mx-auto"></div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Drafting customized freelance proposal/cover letter matching your Proof-of-Work portfolio...
                </p>
              </div>
            ) : proposalError ? (
              <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                Error generating application pitch: {proposalError}
              </div>
            ) : proposalData ? (
              <div className="space-y-6 animate-fade-in text-sm leading-relaxed">
                {/* Tailored Cover Letter / Proposal */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-accent-blue)]">
                      Tailored Cover Letter / Upwork Proposal
                    </h4>
                    <button
                      onClick={() => navigator.clipboard.writeText(proposalData.proposal)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-white border border-[var(--color-border-light)] px-2.5 py-1 rounded bg-[var(--color-bg-secondary)]"
                    >
                      Copy Pitch 📋
                    </button>
                  </div>
                  <pre className="p-4 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] font-sans text-xs whitespace-pre-wrap leading-relaxed text-[var(--color-text-primary)]">
                    {proposalData.proposal}
                  </pre>
                </div>

                {/* Salary Negotiation Strategy */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-accent-orange)]">
                    Salary & Rate Negotiation Strategy
                  </h4>
                  <div className="p-4 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-xs text-[var(--color-text-secondary)]">
                    {proposalData.salaryNegotiation}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Required Attachments */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-success)]">
                      Suggested Attachments / Links
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                      {proposalData.requiredAttachments.map((att, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[var(--color-success)]">📎</span>
                          <span>{att}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Skills Preparation Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-error)]">
                      Interview/Project Prep Checklist
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                      {proposalData.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[var(--color-error)]">⚡</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[var(--color-border-light)]">
                  <button
                    onClick={() => setProposalJob(null)}
                    className="btn-secondary py-2 px-6"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
