'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Pages like login/register can have custom layout if needed, but a unified header/footer still adds high trust.
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const navLinks = [
    { name: 'Profile Hub', href: '/profile' },
    { name: 'TargetMatch Builder', href: '/builder' },
    { name: 'Job Hunt Agent', href: '/jobs' },
    { name: 'PoW Simulator', href: '/simulator' },
    { name: 'User Guide & Analysis', href: '/guide' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] relative overflow-x-hidden flex flex-col">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-bg-primary)]/80 border-b border-[var(--color-border-light)] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 relative z-10 group">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-black font-bold font-mono text-xl">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight font-heading text-white">CareerForge</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {session && navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white border-b-2 border-[var(--color-accent-blue)] pb-1'
                      : 'text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {!session && (
              <Link
                href="/guide"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/guide' ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                Guide & Critique
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4 relative z-10">
            {status === 'authenticated' ? (
              <>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-orange)] hover:text-white transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <span className="hidden sm:inline text-xs text-[var(--color-text-secondary)] font-mono">
                  {session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn-secondary text-xs px-3 py-1.5 border-[var(--color-border-medium)]"
                >
                  Sign Out
                </button>
              </>
            ) : status === 'unauthenticated' ? (
              <>
                <Link href="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2">
                  Get Started
                </Link>
              </>
            ) : (
              <div className="w-6 h-6 border-2 border-t-transparent border-[var(--color-text-secondary)] rounded-full animate-spin-slow"></div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--color-border-light)] bg-black/60 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            
            {/* Branding Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                  <span className="text-black font-bold font-mono text-sm">C</span>
                </div>
                <span className="text-md font-bold tracking-tight font-heading text-white">CareerForge</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
                The modern standard for provable competence. Kill the resume fluff. Build a verified capabilities graph that gets you hired.
              </p>
            </div>

            {/* Core Features Section */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/profile" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Candidate Profile Hub
                  </Link>
                </li>
                <li>
                  <Link href="/builder" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    TargetMatch Optimization
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Agentic Job Matcher
                  </Link>
                </li>
                <li>
                  <Link href="/simulator" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Proof-of-Work Simulator
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/guide" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    How it Works & Setup
                  </Link>
                </li>
                <li>
                  <Link href="/guide#critique" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Market Gap Critique
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Developer Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal / Corporate info */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-mono">Trust & Safety</h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-2">
                All uploaded credentials, keys, and session logs are fully encrypted and securely stored using Supabase PostgreSQL clusters.
              </p>
              <div className="text-[10px] text-[var(--color-text-disabled)] font-mono">
                System Status: <span className="text-[var(--color-success)]">● Operational</span>
              </div>
            </div>

          </div>

          <div className="border-t border-[var(--color-border-light)] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-[var(--color-text-disabled)] font-mono">
              &copy; {new Date().getFullYear()} CareerForge Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-[10px] text-[var(--color-text-disabled)] font-mono">v11.0 Enterprise Edition</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
