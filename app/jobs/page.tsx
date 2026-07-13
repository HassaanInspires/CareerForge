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
  fitExplanation?: string;
  unfitExplanation?: string;
  matchedSkills: string[];
  missingSkills: string[];
  remoteType: string;
  source?: string;
}

interface InterviewQuestion {
  id: string;
  type: 'mcq' | 'multi' | 'text';
  question: string;
  options?: string[];
}

export default function JobAgentPage() {
  const { data: session, status } = useSession();
  
  // Search parameters
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Remote');
  const [depth, setDepth] = useState<'quick' | 'deep'>('quick');
  const [engineSource, setEngineSource] = useState<'mixed' | 'tavily' | 'duckduckgo'>('mixed');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [hasKeys, setHasKeys] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Query Suggestion states
  const [isSuggestingQuery, setIsSuggestingQuery] = useState(false);
  const [suggestedRationale, setSuggestedRationale] = useState<string | null>(null);

  // Interview Modal states
  const [interviewJob, setInterviewJob] = useState<Job | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState<string>('');
  const [selectedMultiAnswers, setSelectedMultiAnswers] = useState<string[]>([]);
  const [shortTextAnswer, setShortTextAnswer] = useState<string>('');
  const [finalAnswersList, setFinalAnswersList] = useState<{ question: string; answer: string }[]>([]);

  // Cover Letter Proposal states
  const [proposalJob, setProposalJob] = useState<Job | null>(null);
  const [proposalData, setProposalData] = useState<{
    proposal: string;
    valueHook: string;
    requiredAttachments: string[];
    salaryNegotiation: string;
    checklist: string[];
    customizationGuide: string;
    followUpTimeline: string[];
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
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await fetch('/api/jobs/save');
      if (res.ok) {
        const data = await res.json();
        setSavedJobs(data.jobs || []);
      }
    } catch (e) {
      console.error('Failed to load saved jobs', e);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleToggleBookmark = async (job: Job) => {
    try {
      const res = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
      if (res.ok) {
        const data = await res.json();
        fetchSavedJobs();
      }
    } catch (e) {
      console.error('Failed to toggle bookmark', e);
    }
  };

  const handleSuggestQuery = async () => {
    setIsSuggestingQuery(true);
    setError(null);
    setSuggestedRationale(null);
    try {
      const res = await fetch('/api/jobs/suggest-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to suggest query');
      
      setQuery(data.query || '');
      setLocation(data.location || 'Remote');
      setSuggestedRationale(data.rationale || '');
    } catch (err: any) {
      setError(`AI Suggestion Error: ${err.message}`);
    } finally {
      setIsSuggestingQuery(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKeys) {
      setError('Please set up your AI Provider and API key in settings before conducting job searches.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchWarning(null);

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
          engineSource,
          provider,
          model,
          userApiKey: apiKey,
          tavilyApiKey: tavilyKey
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search jobs');

      setJobs(data.jobs || []);
      if (data.warning) {
        setSearchWarning(data.warning);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartApplicationFlow = async (job: Job) => {
    setInterviewJob(job);
    setIsGeneratingQuestions(true);
    setInterviewQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedMCQAnswer('');
    setSelectedMultiAnswers([]);
    setShortTextAnswer('');
    setFinalAnswersList([]);

    try {
      const res = await fetch('/api/jobs/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          description: job.description
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load questions');
      setInterviewQuestions(data.questions || []);
    } catch (err: any) {
      console.warn("Interview questions generation failed. Skipping to direct pitch generation.", err);
      setInterviewJob(null);
      handleGenerateProposal(job, []);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleNextQuestion = () => {
    const currentQ = interviewQuestions[currentQuestionIndex];
    let answer = '';

    if (currentQ.type === 'mcq') {
      answer = selectedMCQAnswer || 'No preference';
    } else if (currentQ.type === 'multi') {
      answer = selectedMultiAnswers.length > 0 ? selectedMultiAnswers.join(', ') : 'None selected';
    } else {
      answer = shortTextAnswer || 'No specific answer provided';
    }

    const newAnswers = [...finalAnswersList, { question: currentQ.question, answer }];
    setFinalAnswersList(newAnswers);

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Reset inputs
      setSelectedMCQAnswer('');
      setSelectedMultiAnswers([]);
      setShortTextAnswer('');
    } else {
      // Finished all questions! Trigger Cover letter generator with answers
      const targetJob = interviewJob!;
      setInterviewJob(null);
      handleGenerateProposal(targetJob, newAnswers);
    }
  };

  const handleGenerateProposal = async (job: Job, answers: { question: string; answer: string }[]) => {
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
          userApiKey: apiKey,
          interviewAnswers: answers
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

  const isJobBookmarked = (jobUrl: string) => {
    return savedJobs.some(sj => sj.url === jobUrl);
  };

  const renderJobCard = (job: Job, idx: number) => {
    const bookmarked = isJobBookmarked(job.url);
    return (
      <div key={idx} className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-[var(--color-accent-blue)] hover:border-l-[var(--color-accent-purple)] transition-all">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-lg font-bold text-white leading-snug">{job.title}</h4>
                <button
                  onClick={() => handleToggleBookmark(job)}
                  className="text-lg hover:scale-125 transition-transform focus:outline-none"
                  title={bookmarked ? "Unbookmark job" : "Bookmark job"}
                >
                  {bookmarked ? '⭐' : '☆'}
                </button>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">{job.company}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)]">
                  {job.remoteType}
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-[var(--color-text-secondary)]">
                  {job.location}
                </span>
              </div>
              <span className="text-[10px] md:text-xs uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[var(--color-text-disabled)]">
                {job.source === 'tavily' 
                  ? '🚀 via Tavily' 
                  : job.source === 'adzuna' 
                  ? '💼 via Adzuna' 
                  : job.source === 'themuse' 
                  ? '🎨 via The Muse' 
                  : job.source === 'remoteok'
                  ? '🌴 via RemoteOK'
                  : '🔍 via DuckDuckGo'}
              </span>
            </div>
          </div>

          {/* Scores Section */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border-light)]">
            <div className="text-center border-r border-[var(--color-border-light)]">
              <span className="block text-[11px] md:text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Match Fit</span>
              <span className={`text-xl font-bold px-2 py-0.5 rounded border ${getScoreColor(job.fitScore)}`}>
                {job.fitScore}%
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[11px] md:text-xs uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Company Trust</span>
              <span className={`text-xl font-bold px-2 py-0.5 rounded border ${getScoreColor(job.trustScore)}`}>
                {job.trustScore}%
              </span>
            </div>
          </div>

          {/* Fit Rationale Section */}
          <div className="space-y-2 mb-4">
            {job.fitExplanation && (
              <div className="text-xs p-2.5 rounded bg-[rgba(34,197,94,0.03)] border border-[rgba(34,197,94,0.12)] text-[var(--color-success)]">
                <strong>✔ Fit Analysis:</strong> {job.fitExplanation}
              </div>
            )}
            {job.unfitExplanation && (
              <div className="text-xs p-2.5 rounded bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.12)] text-[var(--color-accent-orange)]">
                <strong>⚠ Caution Points:</strong> {job.unfitExplanation}
              </div>
            )}
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3 mb-4 leading-relaxed">
            {job.description}
          </p>

          {/* Trust Explanation */}
          <div className="text-xs p-2.5 rounded bg-[rgba(235,166,90,0.03)] border border-[rgba(235,166,90,0.12)] text-[var(--color-text-secondary)] mb-4">
            <strong>AI Trust Audit:</strong> {job.trustExplanation}
          </div>

          {/* Skills alignment */}
          <div className="space-y-2 mb-6">
            {job.matchedSkills && job.matchedSkills.length > 0 && (
              <div>
                <span className="text-[11px] md:text-xs uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">Matched Skills</span>
                <div className="flex flex-wrap gap-1">
                  {job.matchedSkills.map((s, i) => (
                    <span key={i} className="text-[11px] md:text-xs px-2 py-1 rounded bg-[rgba(34,197,94,0.1)] text-[var(--color-success)] border border-[rgba(34,197,94,0.2)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div>
                <span className="text-[11px] md:text-xs uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">Missing Requirements</span>
                <div className="flex flex-wrap gap-1">
                  {job.missingSkills.map((s, i) => (
                    <span key={i} className="text-[11px] md:text-xs px-2 py-1 rounded bg-[rgba(239,68,68,0.1)] text-[var(--color-error)] border border-[rgba(239,68,68,0.2)]">
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
              onClick={() => handleStartApplicationFlow(job)}
              className="btn-primary mt-2"
            >
              Generate Pitch &amp; Proposal Strategy ⚡
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 font-sans text-white">

      <main className="max-w-6xl mx-auto space-y-8 animate-fade-in">

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--color-border-light)] gap-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'search' ? 'text-white border-b-2 border-[var(--color-accent-purple)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
          >
            🕵️ Job Hunt Agent
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              fetchSavedJobs();
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'saved' ? 'text-white border-b-2 border-[var(--color-accent-purple)]' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
          >
            ⭐ Starred Openings ({savedJobs.length})
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            {/* Search Parameter Dashboard */}
            <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent-purple)]">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-white">Configure Job Hunt Crawler</h2>
                <button
                  type="button"
                  onClick={handleSuggestQuery}
                  disabled={isSuggestingQuery}
                  className="text-xs px-3 py-2 rounded bg-[rgba(147,51,234,0.15)] border border-[rgba(147,51,234,0.3)] text-[var(--color-accent-purple)] font-bold hover:bg-[rgba(147,51,234,0.25)] transition-colors touch-target"
                >
                  {isSuggestingQuery ? 'AI Suggesting...' : '✨ Suggest Query via AI'}
                </button>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                The AI Agent aggregates remote hybrid listings, queries live web indexes (Tavily/DuckDuckGo), and tests skills compatibility against your CV.
              </p>

              {suggestedRationale && (
                <div className="mb-6 p-4 rounded bg-[rgba(147,51,234,0.05)] border border-[rgba(147,51,234,0.15)] text-xs text-[var(--color-text-secondary)] animate-fade-in">
                  <strong className="text-[var(--color-accent-purple)] block mb-1">🤖 AI Query Rationale:</strong>
                  {suggestedRationale}
                </div>
              )}

              {!hasKeys && (
                <div className="mb-6 p-4 rounded bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] text-[var(--color-error)] text-sm">
                  ⚠️ <strong>Action Required:</strong> You must configure your AI keys in <Link href="/settings" className="underline font-bold hover:text-white">Settings</Link> first. Search engines and match rankings cannot run without an active provider.
                </div>
              )}

              {searchWarning && (
                <div className="mb-6 p-4 rounded bg-[rgba(245,158,11,0.1)] border border-[var(--color-accent-orange)] text-[var(--color-accent-orange)] text-sm">
                  ⚠️ <strong>Search Alert:</strong> {searchWarning}
                </div>
              )}

              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Search Engine</label>
                  <select
                    value={engineSource}
                    onChange={(e) => setEngineSource(e.target.value as any)}
                    className="input-field w-full text-sm py-2"
                  >
                    <option value="mixed">Mixed Engines (Tavily + DDG)</option>
                    <option value="duckduckgo">DuckDuckGo Scraper (Free)</option>
                    <option value="tavily">Tavily Engine (Premium)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">Depth</label>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value as any)}
                    className="input-field w-full text-sm py-2"
                  >
                    <option value="quick">Quick (6 jobs)</option>
                    <option value="deep">Deep Scan (12 jobs)</option>
                  </select>
                </div>
                <div className="md:col-span-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !hasKeys}
                    className="btn-primary w-full md:w-auto px-8 py-2.5 font-bold text-sm tracking-wide bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] hover:opacity-90"
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
                  Contacting web indexes, parsing postings, auditing authenticity, and rating matched competencies...
                </p>
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Active Verified Openings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, idx) => renderJobCard(job, idx))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-[var(--color-text-secondary)]">
                <p className="italic">No active search indexes loaded. Configure search keywords above to execute agent scan.</p>
              </div>
            )}
          </>
        ) : (
          /* Starred/Saved Openings tab */
          <div>
            {isLoadingSaved ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-purple)] mx-auto"></div>
              </div>
            ) : savedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedJobs.map((job, idx) => renderJobCard(job, idx))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center text-[var(--color-text-secondary)]">
                <p className="italic">You haven't bookmarked any jobs yet. Star jobs in search results to view them here.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Clarification Interview Modal */}
      {interviewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-8 space-y-6 border border-[var(--color-border-medium)] animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">
                  ⚡ Refining Application Strategy
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Answer these quick questions to help AI write a hyper-personalized cover letter for {interviewJob.title} at {interviewJob.company}.
                </p>
              </div>
              <button
                onClick={() => setInterviewJob(null)}
                className="text-2xl text-[var(--color-text-disabled)] hover:text-white"
              >
                &times;
              </button>
            </div>

            {isGeneratingQuestions ? (
              <div className="text-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-purple)] mx-auto"></div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Generating custom interview questions matching this job's profile...
                </p>
              </div>
            ) : interviewQuestions.length > 0 ? (
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="w-full bg-[rgba(255,255,255,0.05)] rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%` }}
                  ></div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-accent-purple)] font-bold">
                    Question {currentQuestionIndex + 1} of {interviewQuestions.length}
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {interviewQuestions[currentQuestionIndex].question}
                  </p>
                </div>

                {/* Question Inputs */}
                <div className="p-4 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--color-border-light)]">
                  {interviewQuestions[currentQuestionIndex].type === 'mcq' && (
                    <div className="space-y-3">
                      {interviewQuestions[currentQuestionIndex].options?.map((opt, i) => (
                        <label key={i} className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] hover:text-white cursor-pointer p-2 rounded hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <input
                            type="radio"
                            name="mcq"
                            value={opt}
                            checked={selectedMCQAnswer === opt}
                            onChange={(e) => setSelectedMCQAnswer(e.target.value)}
                            className="text-[var(--color-accent-purple)] focus:ring-[var(--color-accent-purple)] bg-[var(--color-bg-secondary)]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {interviewQuestions[currentQuestionIndex].type === 'multi' && (
                    <div className="space-y-3">
                      {interviewQuestions[currentQuestionIndex].options?.map((opt, i) => {
                        const checked = selectedMultiAnswers.includes(opt);
                        return (
                          <label key={i} className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] hover:text-white cursor-pointer p-2 rounded hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setSelectedMultiAnswers(selectedMultiAnswers.filter(x => x !== opt));
                                } else {
                                  setSelectedMultiAnswers([...selectedMultiAnswers, opt]);
                                }
                              }}
                              className="rounded text-[var(--color-accent-purple)] focus:ring-[var(--color-accent-purple)] bg-[var(--color-bg-secondary)]"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {interviewQuestions[currentQuestionIndex].type === 'text' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Type your brief answer here..."
                        value={shortTextAnswer}
                        onChange={(e) => setShortTextAnswer(e.target.value)}
                        className="input-field w-full text-xs py-2 px-3"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setInterviewJob(null)}
                    className="text-xs text-[var(--color-text-disabled)] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="btn-primary py-2 px-6 text-xs bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] font-bold"
                  >
                    {currentQuestionIndex === interviewQuestions.length - 1 ? 'Finish & Generate Pitch ⚡' : 'Next Question →'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Proposal Generator Modal */}
      {proposalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-scale-up">
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
              <div className="space-y-6 animate-fade-in text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                
                {/* 1. Value Proposition Hook */}
                {proposalData.valueHook && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-[rgba(147,51,234,0.12)] to-[rgba(59,130,246,0.12)] border border-[rgba(147,51,234,0.25)] text-center text-xs font-semibold text-white">
                    💡 <strong className="text-[var(--color-accent-purple)]">AI Pitch Hook:</strong> "{proposalData.valueHook}"
                  </div>
                )}

                {/* 2. Cover Letter */}
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

                {/* 3. Customization Resume Guide */}
                {proposalData.customizationGuide && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-accent-blue)]">
                      🛠️ Portfolio & Resume Customization Guide
                    </h4>
                    <div className="p-4 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {proposalData.customizationGuide}
                    </div>
                  </div>
                )}

                {/* 4. Salary Negotiation */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-accent-orange)]">
                    Salary & Rate Negotiation Strategy
                  </h4>
                  <div className="p-4 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] text-xs text-[var(--color-text-secondary)]">
                    {proposalData.salaryNegotiation}
                  </div>
                </div>

                {/* 5. Attachments and Prep checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* 6. Follow-up Timeline */}
                {proposalData.followUpTimeline && proposalData.followUpTimeline.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--color-accent-purple)]">
                      📅 Recommended Follow-Up Sequence
                    </h4>
                    <div className="relative pl-6 border-l-2 border-[var(--color-border-medium)] space-y-4">
                      {proposalData.followUpTimeline.map((step, idx) => {
                        const colonIndex = step.indexOf(':');
                        const day = colonIndex !== -1 ? step.substring(0, colonIndex) : `Step ${idx + 1}`;
                        const action = colonIndex !== -1 ? step.substring(colonIndex + 1).trim() : step;
                        return (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[31px] top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-accent-purple)] text-[8px] font-bold text-white">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-[var(--color-text-primary)] font-semibold mb-0.5">
                              {day}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              {action}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
