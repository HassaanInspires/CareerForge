import Link from 'next/link';

export default function Home() {
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
          <Link href="/profile" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Profile Hub
          </Link>
          <Link href="/builder" className="btn-primary text-sm px-4 py-2">
            Builder Mode
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border-medium)] bg-[var(--color-bg-secondary)] mb-8">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)]"></span>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Enterprise V3.0 is now live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 leading-tight">
          Verifiable impact.<br className="hidden md:block" />
          <span className="text-[var(--color-text-secondary)]">Not AI buzzwords.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
          The only AI resume engine that extracts authentic metrics, matches against real market demands, and builds persistent career memory to defeat modern Applicant Tracking Systems.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/builder" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
            Start Diagnostic Session
          </Link>
          <Link href="#features" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
            View Architecture
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
