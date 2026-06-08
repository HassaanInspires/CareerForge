'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SmartQuestions } from '@/lib/types';

interface StepThreeProps {
  currentData: SmartQuestions;
  resumeBase64?: string;
  jobDescription?: string;
  onNext: (data: SmartQuestions) => void;
  onBack: () => void;
}

export default function StepThree({ currentData, resumeBase64, jobDescription, onNext, onBack }: StepThreeProps) {
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<SmartQuestions>(currentData || {});
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      // Use local storage for keys
      const provider = localStorage.getItem('cf_provider') || 'anthropic';
      const apiKey = localStorage.getItem(`cf_key_${provider}`) || '';
      const model = localStorage.getItem(`cf_model_${provider}`) || '';

      if (!resumeBase64 || !jobDescription) {
        setInitError('Missing Resume or Job Description context.');
        setIsInitializing(false);
        return;
      }

      try {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeBase64,
            jobDescription,
            provider,
            model,
            userApiKey: apiKey,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate questions');
        }
        
        const qList = data.questions.map((text: string, index: number) => ({
          id: `q${index + 1}`,
          text
        }));
        
        setQuestions(qList);
        setMessages([{ role: 'ai', text: qList[0].text }]);
      } catch (err: any) {
        setInitError(err.message);
      } finally {
        setIsInitializing(false);
      }
    };

    if (questions.length === 0 && isInitializing) {
      // If we already have currentData (e.g., user went back), we could try to reuse it
      // but for dynamic questions, we should ideally re-fetch or persist questions.
      // For simplicity, we just fetch new ones if none exist.
      fetchQuestions();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isInitializing]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping || questions.length === 0) return;

    const newAnswer = inputValue;
    
    setAnswers(prev => ({ ...prev, [questions[currentQIndex].text]: newAnswer }));
    setMessages(prev => [...prev, { role: 'user', text: newAnswer }]);
    setInputValue('');

    if (currentQIndex < questions.length - 1) {
      setIsTyping(true);
      setTimeout(() => {
        setCurrentQIndex(prev => prev + 1);
        setMessages(prev => [...prev, { role: 'ai', text: questions[currentQIndex + 1].text }]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const isFinished = questions.length > 0 && currentQIndex === questions.length - 1 && answers[questions[questions.length - 1].text];

  const handleSubmit = () => {
    onNext(answers);
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in h-[550px]">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-[var(--color-bg-tertiary)]"></div>
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-t-[var(--color-accent-blue)] border-r-[var(--color-accent-purple)] border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🧠</span>
          </div>
        </div>
        <h3 className="text-xl font-heading font-bold text-white mb-2">Analyzing Context...</h3>
        <p className="text-[var(--color-text-secondary)]">The AI is cross-referencing your resume with the job description to formulate tailored questions.</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in h-[550px]">
        <div className="p-6 bg-[rgba(239,68,68,0.1)] border border-[var(--color-error)] rounded-xl max-w-md">
          <h3 className="text-[var(--color-error)] font-bold mb-2">Failed to initialize AI Chat</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">{initError}</p>
          <button onClick={onBack} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in h-[550px] flex flex-col">
      <div className="text-center shrink-0">
        <h2 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">Interactive AI Diagnostic</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Answer a few tailored questions based on your profile and target job.
        </p>
      </div>

      <div className="flex-1 glass-card p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-[var(--color-accent-blue)] text-white rounded-br-none shadow-[0_0_15px_rgba(0,212,255,0.2)]' 
                : 'bg-[rgba(255,255,255,0.05)] border border-[var(--color-border-medium)] text-[var(--color-text-primary)] rounded-bl-none'
            }`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[rgba(255,255,255,0.05)] border border-[var(--color-border-medium)] p-4 rounded-2xl rounded-bl-none flex gap-2">
              <div className="w-2 h-2 bg-[var(--color-text-disabled)] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[var(--color-text-disabled)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-[var(--color-text-disabled)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
              placeholder="Type your answer here..."
              className="input-field flex-1"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="btn-primary px-6"
              disabled={!inputValue.trim() || isTyping}
            >
              Send
            </button>
          </form>
        ) : (
          <div className="flex justify-center p-4 bg-[rgba(0,212,255,0.1)] border border-[var(--color-accent-blue)] rounded-xl animate-pop-in">
            <p className="text-[var(--color-accent-blue)] font-medium">Diagnostic complete! You can now proceed.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4 pt-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-[var(--color-border-medium)] bg-transparent py-3 px-4 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFinished}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Preferences
        </button>
      </div>
    </div>
  );
}
