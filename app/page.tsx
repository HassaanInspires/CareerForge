import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="w-full relative z-10">

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 md:pt-32 pb-16 md:pb-20 max-w-5xl mx-auto animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border-medium)] bg-[var(--color-bg-secondary)] mb-6 md:mb-8">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)]"></span>
          <span className="text-[11px] md:text-xs font-medium text-[var(--color-text-secondary)]">V5.0: The Proof-of-Work Pivot</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white mb-4 md:mb-6 leading-[1.1]">
          Kill the resume.<br className="hidden md:block" />{' '}
          <span className="text-[var(--color-text-secondary)]">Prove your work.</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2 md:px-0">
          The AI resume is dead. Recruiters want proof, not generated fluff. CareerForge connects your actual commits, runs live micro-assessments, and builds a Verified Capabilities Graph that employers actually trust.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link href="/simulator" className="btn-primary text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto text-center">
            Try the PoW Simulator
          </Link>
          <Link href="#features" className="btn-secondary text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto text-center">
            How Verification Works
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-card p-6 md:p-8">
            <div className="w-10 h-10 rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4 md:mb-6">
              <span className="text-lg md:text-xl">🧠</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3">Persistent Memory</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Maintains a continuous candidate graph across sessions. Our RAG-inspired local memory tracks your metrics and experiences, preventing repetitive questions.
            </p>
          </div>
          <div className="glass-card p-6 md:p-8">
            <div className="w-10 h-10 rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4 md:mb-6">
              <span className="text-lg md:text-xl">🛡️</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3">Strict Guardrails</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Powered by Chain-of-Thought reasoning. The AI refuses to hallucinate skills, strips out generic buzzwords, and demands verifiable outcomes.
            </p>
          </div>
          <div className="glass-card p-6 md:p-8">
            <div className="w-10 h-10 rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4 md:mb-6">
              <span className="text-lg md:text-xl">💬</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3">Infinite Interview Loop</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              A dynamic, ongoing conversation. The engine analyzes your base CV against the Job Description and asks exact contextual questions until data sufficiency is reached.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
