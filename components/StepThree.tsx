'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CandidateMemory, defaultMemory } from '@/lib/memory';

interface StepThreeProps {
  currentMemory: CandidateMemory;
  resumeBase64?: string;
  jobDescription?: string;
  onNext: (memory: CandidateMemory) => void;
  onBack: () => void;
}

export default function StepThree({ currentMemory, resumeBase64, jobDescription, onNext, onBack }: StepThreeProps) {
  const [memory, setMemory] = useState<CandidateMemory>(currentMemory || defaultMemory);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [initError, setInitError] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calls the chat engine with current context
  const sendToEngine = async (currentMessages: { role: 'ai' | 'user', content: string }[]) => {
    setIsTyping(true);
    setInitError('');

    try {
      const provider = localStorage.getItem('cf_provider') || 'anthropic';
      const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
      const model = localStorage.getItem(`cf_model_${provider}`) || '';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          resumeBase64,
          jobDescription,
          memory,
          provider,
          model,
          userApiKey: apiKey,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with AI Engine');
      }
      
      if (data.memory) {
        setMemory(data.memory);
      }

      if (data.isFinished || data.response.includes('[READY_TO_OPTIMIZE]')) {
        setIsFinished(true);
        setMessages(prev => [...prev, { role: 'ai', content: data.response.replace('[READY_TO_OPTIMIZE]', '').trim() }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      }
    } catch (err: any) {
      setInitError(err.message);
    } finally {
      setIsTyping(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (messages.length === 0 && isInitializing) {
      if (!resumeBase64 || !jobDescription) {
        setInitError('Missing Resume or Job Description context.');
        setIsInitializing(false);
        return;
      }
      // Trigger initial analysis
      sendToEngine([]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isInitializing]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping || isFinished) return;

    const newMessages = [...messages, { role: 'user' as const, content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    
    await sendToEngine(newMessages);
  };

  const handleSubmit = () => {
    onNext(memory);
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[550px]">
        <div className="animate-spin-slow rounded-full h-12 w-12 border-b-2 border-t-2 border-[var(--color-text-primary)] mb-6"></div>
        <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)] mb-2">Analyzing Profile Data</h3>
        <p className="text-[var(--color-text-secondary)]">Extracting verifiable metrics and identifying market gaps...</p>
      </div>
    );
  }

  if (initError && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[550px]">
        <div className="p-6 bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] rounded-xl max-w-md">
          <h3 className="text-[var(--color-error)] font-bold mb-2">Engine Initialization Failed</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">{initError}</p>
          <button onClick={onBack} className="btn-secondary">Return to Job Description</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in h-[600px] flex flex-col">
      <div className="flex justify-between items-center shrink-0 mb-2">
        <div>
          <h2 className="text-xl font-heading font-bold text-[var(--color-text-primary)]">Data Extraction Loop</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            AI is verifying your metrics. Answer concisely.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Data Sufficiency:</span>
          <div className="w-24 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${memory.dataSufficiencyScore >= 85 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent-blue)]'}`}
              style={{ width: `${Math.min(memory.dataSufficiencyScore, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-card p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' 
                : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-medium)] text-[var(--color-text-primary)]'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-medium)] px-4 py-3 rounded-lg flex gap-1">
              <div className="w-1.5 h-1.5 bg-[var(--color-text-disabled)] rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-[var(--color-text-disabled)] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 h-1.5 bg-[var(--color-text-disabled)] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-2">
        {!isFinished ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Provide verifiable numbers or exact tool names..."
              className="input-field flex-1"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="btn-primary"
              disabled={!inputValue.trim() || isTyping}
            >
              Send
            </button>
          </form>
        ) : (
          <div className="flex justify-between items-center p-3 border border-[var(--color-success)] bg-[rgba(16,185,129,0.05)] rounded-lg">
            <span className="text-sm font-medium text-[var(--color-success)]">Verification Complete</span>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary py-2 px-6"
            >
              Proceed to Preferences
            </button>
          </div>
        )}
      </div>
      
      {initError && messages.length > 0 && (
        <p className="text-[var(--color-error)] text-xs text-center">{initError}</p>
      )}

      {!isFinished && (
        <div className="flex justify-between shrink-0 pt-2 border-t border-[var(--color-border-light)]">
          <button type="button" onClick={onBack} className="btn-secondary py-2 text-xs">Back</button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] text-xs transition-colors"
          >
            Force Skip (Not Recommended)
          </button>
        </div>
      )}
    </div>
  );
}
