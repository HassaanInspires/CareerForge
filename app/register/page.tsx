'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      // Registration successful, redirect to login
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-6 font-sans">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight hover:opacity-80">
        CareerForge
      </Link>
      
      <div className="glass-card p-8 w-full max-w-md border-t-4 border-t-[var(--color-accent-purple)]">
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">Start building your Verified Career Graph.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Name</label>
            <input 
              type="text" 
              required
              className="input-field w-full" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account? <Link href="/login" className="text-[var(--color-accent-purple)] hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
