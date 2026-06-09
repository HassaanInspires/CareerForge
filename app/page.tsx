import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Top Nav */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold font-mono text-xl">C</span>
          </div>
          <span className="text-lg font-bold tracking-tight">CareerForge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Settings
          </Link>
          
          {session ? (
            <>
              {(session.user as any)?.role === 'ADMIN' && (
                <Link href="/admin" className="text-sm font-medium text-[var(--color-accent-orange)] hover:text-white transition-colors">
                  Admin Panel
                </Link>
              )}
              <Link href="/profile" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
                Profile Hub
              </Link>
              <Link href="/jobs" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
                Job Hunt Agent
              </Link>
              <Link href="/simulator" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
                PoW Simulator
              </Link>
              <Link href="/api/auth/signout" className="btn-secondary text-sm px-4 py-2">
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border-medium)] bg-[var(--color-bg-secondary)] mb-8">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-purple)]"></span>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">V5.0: The Proof-of-Work Pivot</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-tight">
          Kill the resume.<br className="hidden md:block" />
          <span className="text-[var(--color-text-secondary)]">Prove your work.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
          The AI resume is dead. Recruiters want proof, not generated fluff. CareerForge connects your actual commits, runs live micro-assessments, and builds a Verified Capabilities Graph that employers actually trust.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/simulator" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
            Try the PoW Simulator
          </Link>
          <Link href="#features" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
            How Verification Works
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8">
            <div className="w-10 h-10 rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-6">
              <span className="text-xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Persistent Memory</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Maintains a continuous candidate graph across sessions. Our RAG-inspired local memory tracks your metrics and experiences, preventing repetitive questions.
            </p>
          </div>
          <div className="glass-card p-8">
            <div className="w-10 h-10 rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-6">
              <span className="text-xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Strict Guardrails</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Powered by Chain-of-Thought reasoning. The AI refuses to hallucinate skills, strips out generic buzzwords, and demands verifiable outcomes.
            </p>
          </div>
          <div className="glass-card p-8">
            <div className="w-10 h-10 rounded-lg border border-[var(--color-border-medium)] bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-6">
              <span className="text-xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Infinite Interview Loop</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              A dynamic, ongoing conversation. The engine analyzes your base CV against the Job Description and asks exact contextual questions until data sufficiency is reached.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
