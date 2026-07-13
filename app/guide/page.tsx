'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'how-to-use' | 'api-setup' | 'critique'>('how-to-use');

  const faqItems = [
    {
      q: 'Do I really need a DuckDuckGo Search API Key?',
      a: 'No! There is no official DuckDuckGo API key required. Our system has a built-in unauthenticated HTML scraper that works professionally out of the box for free. The field in Settings is strictly optional for advanced routing configurations.',
    },
    {
      q: 'How does pgvector RAG work in CareerForge?',
      a: 'When you upload your CV, we chunk the text and send it to Hugging Face to generate 384-dimensional vector embeddings. These are stored in Supabase. When you match jobs or chat with the AI, we perform semantic similarity queries to fetch relevant parts of your experience in real time.',
    },
    {
      q: 'What is the Proof-of-Work (PoW) Simulator?',
      a: 'The PoW Simulator allows you to create mock development projects (e.g., GitHub repo, NPM packages) and generate verified metric outputs (lines of code, test coverage) to prove you actually built what is written in your profile.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-20 animate-fade-in">

      {/* Title */}
      <div className="mb-8 md:mb-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-heading text-white mb-4">
          Platform Documentation & Strategy
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl">
          Everything you need to know about setting up API integrations, understanding CareerForge's internal engines, and our market-fit analysis.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border-light)] mb-8 md:mb-12 overflow-x-auto gap-1 md:gap-2">
        <button
          onClick={() => setActiveTab('how-to-use')}
          className={`py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-semibold tracking-wider uppercase font-mono border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'how-to-use'
              ? 'border-[var(--color-accent-blue)] text-white'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          📖 How to Use
        </button>
        <button
          onClick={() => setActiveTab('api-setup')}
          className={`py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-semibold tracking-wider uppercase font-mono border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'api-setup'
              ? 'border-[var(--color-accent-blue)] text-white'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          🔑 API Setup Guide
        </button>
        <button
          onClick={() => setActiveTab('critique')}
          className={`py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-semibold tracking-wider uppercase font-mono border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'critique'
              ? 'border-[var(--color-accent-blue)] text-white'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-white'
          }`}
        >
          📊 Critique &amp; Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-12">
        
        {/* TAB 1: How to Use */}
        {activeTab === 'how-to-use' && (
          <div className="space-y-12 animate-slide-up">
            
            {/* Mission Statement */}
            <div className="glass-card p-6 md:p-8 bg-gradient-to-r from-zinc-900 to-black">
              <h2 className="text-2xl font-bold font-heading text-white mb-4">The CareerForge Vision</h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                The traditional resume is a text file filled with unverified claims, subjective buzzwords, and exaggerated metrics. In the age of generative AI, resume spam is at an all-time high, prompting recruiters to use filters that screen out talented applicants.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <strong>CareerForge's primary goal:</strong> Replace the static text resume with a <strong>Verified Capabilities Graph</strong> backed by tangible <strong>Proof of Work (PoW)</strong>. By verifying source code repositories, npm deployments, and hosting live mock simulators, we verify actual impact rather than written fluff.
              </p>
            </div>

            {/* Sections walkthrough */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold font-mono">1</div>
                  <h3 className="text-lg font-bold text-white">Profile & Onboarding Hub</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Start by uploading your current resume. The onboarding engine converts the PDF into semantic vector blocks and stores it. An interactive <strong>Onboarding Coach</strong> then starts asking targeted questions about your projects to fill critical gaps in metrics.
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold font-mono">2</div>
                  <h3 className="text-lg font-bold text-white">TargetMatch Optimizer</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Paste the description of any target job listing. The matching engine compares the job requirements with your Supabase candidate graph, generates a <strong>Brutal Reality Check</strong> highlighting your missing skills, and constructs a strategic <strong>Employer Brief</strong> to target the job requirements.
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold font-mono">3</div>
                  <h3 className="text-lg font-bold text-white">Agentic Job Matcher</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Run keyword and location queries. The crawler searches active streams (LinkedIn, Upwork, Remotive, Arbeitnow, Greenhouse, and Lever portals) in parallel. An authenticity agent scores the listing's reliability, filtering fake posts, and computes your compatibility rating.
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold font-mono">4</div>
                  <h3 className="text-lg font-bold text-white">PoW Simulator</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Build credibility. Import your GitHub projects or simulate coding/deployment metrics. The simulator outputs verified metrics showing test coverage, commit densities, and code complexity to append directly to your candidate graph.
                </p>
              </div>

            </div>

            {/* FAQs */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading text-white">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqItems.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-lg border border-[var(--color-border-light)] bg-white/[0.01]">
                    <h4 className="font-semibold text-white mb-2 text-sm">{item.q}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: API Setup Guide */}
        {activeTab === 'api-setup' && (
          <div className="space-y-8 animate-slide-up max-w-4xl">
            
            <div className="glass-card p-6 border-l-4 border-l-[var(--color-accent-blue)]">
              <h3 className="text-lg font-bold text-white mb-2">Centralized Database Settings</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                All keys are stored securely in your private user profile in Supabase. You only need to set them up once in the <Link href="/settings" className="underline text-white font-medium hover:text-[var(--color-accent-blue)]">Settings Dashboard</Link> to run optimization pipelines and job searches across devices.
              </p>
            </div>

            <div className="space-y-6">
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white font-mono">1. LLM Core Provider Keys (Required for Optimization & Chat)</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Choose your preferred inference model. Currently supported integrations:
                </p>
                <ul className="list-disc list-inside text-xs text-[var(--color-text-secondary)] space-y-1 pl-2">
                  <li><strong>Anthropic (Claude 3.5 Sonnet)</strong>: Best for nuanced, high-fidelity resume refining.</li>
                  <li><strong>OpenAI (GPT-4o)</strong>: Exceptional capability for ATS keyword parsing.</li>
                  <li><strong>Google Gemini (Gemini 1.5 Pro)</strong>: Best for processing large context window requirements.</li>
                  <li><strong>Groq / Mistral</strong>: Recommended fast, cost-effective open-source alternatives.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white font-mono">2. Tavily Search API Key (Optional but Recommended)</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Provide a search token to trigger parallel deep-search crawls over LinkedIn and freelance boards. 
                  Get a free search key (up to 1,000 queries/month) at <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline text-white">tavily.com</a>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white font-mono">3. DuckDuckGo Scraper Integration (Optional, 100% Free)</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  There is <strong>no API key required</strong> to search with DuckDuckGo. The built-in search scraper retrieves search results from DDG automatically for free. The settings input is strictly for advanced customization.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: Strategic Critique */}
        {activeTab === 'critique' && (
          <div className="space-y-8 animate-slide-up max-w-4xl" id="critique">
            
            {/* The Rating Card */}
            <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-zinc-950 to-zinc-900 border border-[var(--color-border-medium)]">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Strategic Evaluation
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">Market Fit & Execution Score</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-md">
                  Evaluating CareerForge against the current ATS bypass software market, candidate coaching suites, and proof-of-work verification layers.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-black text-white font-mono bg-zinc-900 w-24 h-24 rounded-full flex items-center justify-center border-4 border-[var(--color-accent-blue)] shadow-lg">
                  8/10
                </div>
                <span className="text-[10px] text-[var(--color-text-disabled)] font-mono mt-2">Professional Rating</span>
              </div>
            </div>

            {/* Critique Grid */}
            <div className="space-y-6">
              
              <div>
                <h4 className="text-md font-bold text-white mb-2">Why It Scores 8/10 (The Strengths)</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Unlike typical generic AI builders that spit out static keyword-stuffed PDFs, CareerForge addresses the core problem: <strong>trust</strong>.
                  The integration of NextAuth, PostgreSQL schema persistence, and vector RAG matches the candidate's actual credentials securely. The <strong>Agentic Job Matcher</strong> calculates trust and fit percentages based on verified facts rather than simple resume claims.
                </p>
              </div>

              <div>
                <h4 className="text-md font-bold text-white mb-2">What is Missing (The Gaps to 10/10)</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  To achieve absolute market dominance and fill all user acquisition gaps, two key integrations are currently missing:
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded border border-red-500/10 bg-red-500/[0.01]">
                    <h5 className="text-xs font-semibold text-red-400 mb-1">Gap 1: Absence of a Public Portfolio/Artifact Hosting Layer</h5>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                      Candidates want to share their "Verified Capability Graph" directly with recruiters via a public web URL. Right now, the matched results are locked behind the private user dashboard.
                    </p>
                  </div>
                  <div className="p-4 rounded border border-red-500/10 bg-red-500/[0.01]">
                    <h5 className="text-xs font-semibold text-red-400 mb-1">Gap 2: Lack of Automated One-Click Job Application Agents</h5>
                    <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                      While the platform generates cover letters and customized proposals (Upwork, etc.), the user must still copy-paste them manually. The next iteration needs automated submission scripts.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-bold text-white mb-2">The Actionable Roadmap (The Solutions)</h4>
                <div className="space-y-2 text-xs text-[var(--color-text-secondary)] list-decimal list-inside pl-2">
                  <p><strong>1. Public Profile Portals</strong>: Generate a secure, sharing URL (e.g. `careerforge.com/share/candidate-id`) rendering the Proof-of-Work verified metrics graph as a clean web dashboard for recruiters.</p>
                  <p><strong>2. Browser Extension Auto-Apply</strong>: Develop a Chrome extension that overlays the custom pitch, rate, and CV details directly on active Greenhouse/Lever/LinkedIn job forms on one click.</p>
                  <p><strong>3. Smart GitHub/Vercel Sync</strong>: Automate the Proof-of-Work updates using webhooks so commits and live project stats update automatically daily without manual simulation.</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
      
    </div>
  );
}
