import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cool Background Animation Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent-blue)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--color-accent-purple)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[var(--color-accent-orange)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-4xl w-full text-center z-10 animate-slide-up">
        <div className="inline-block mb-6 p-2 bg-[rgba(255,255,255,0.05)] border border-[var(--color-border-medium)] rounded-full backdrop-blur-md">
          <span className="bg-gradient-to-r from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] text-transparent bg-clip-text font-bold px-3">
            v2.0 SkilledScore Edition
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-heading font-black text-white tracking-tight mb-8">
          The <span className="text-[var(--color-accent-blue)]">AI</span> Career<br />
          Diagnostic <span className="text-[var(--color-accent-purple)]">Engine</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">
          Don't just write a resume. Understand your exact market fit, identify blocking skill gaps, and get a tailored career roadmap powered by deep AI insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/builder" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto animate-bounce-in shadow-[0_0_30px_rgba(0,212,255,0.3)]">
            Start Free Diagnostic
          </Link>
          <Link href="/settings" className="rounded-xl border border-[var(--color-border-medium)] bg-transparent py-4 px-8 text-lg font-medium text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors w-full sm:w-auto">
            Configure AI Keys
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center mb-4">
              <span className="text-[var(--color-accent-blue)] text-2xl">🎯</span>
            </div>
            <h3 className="font-heading font-bold text-white mb-2">Precision Scoring</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Get an ATS and human readability score mapped exactly to your target job description.</p>
          </div>
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(143,0,255,0.1)] flex items-center justify-center mb-4">
              <span className="text-[var(--color-accent-purple)] text-2xl">🔍</span>
            </div>
            <h3 className="font-heading font-bold text-white mb-2">Gap Analysis</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Identify the exact "blocking" factors and missing skills preventing you from getting hired.</p>
          </div>
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(255,107,53,0.1)] flex items-center justify-center mb-4">
              <span className="text-[var(--color-accent-orange)] text-2xl">🗺️</span>
            </div>
            <h3 className="font-heading font-bold text-white mb-2">Career Roadmap</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Receive actionable steps, courses, and certifications to quickly bridge your knowledge gaps.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
