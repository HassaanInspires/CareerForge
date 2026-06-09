'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight hover:opacity-80">
        CareerForge
      </Link>
      
      <div className="glass-card p-8 w-full max-w-md border-t-4 border-t-[var(--color-accent-blue)]">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">Sign in to access your Verified Career Graph.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Email</label>
            <input 
              type="email" 
              required
              className="input-field w-full" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Password</label>
            <input 
              type="password" 
              required
              className="input-field w-full" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn-primary py-3 mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Don't have an account? <Link href="/register" className="text-[var(--color-accent-blue)] hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
