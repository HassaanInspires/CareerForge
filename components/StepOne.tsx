'use client';

import React, { useState } from 'react';

interface StepOneProps {
  onNext: (data: { resumeBase64: string; fileName: string }) => void;
  onError: (error: string) => void;
}

export default function StepOne({ onNext, onError }: StepOneProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: PDF, DOCX, DOC
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExtension = ['pdf', 'docx', 'doc'].includes(extension || '');

    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      onError('Please upload a PDF or Word document (.docx, .doc).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB.');
      return;
    }

    setIsExtracting(true);
    setFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        setIsExtracting(false);
        onNext({ resumeBase64: base64, fileName: file.name });
      };
      reader.onerror = () => {
        setIsExtracting(false);
        onError('Failed to read file.');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsExtracting(false);
      onError('An error occurred during file processing.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold text-[var(--color-text-primary)]">Upload your Resume</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Upload your resume in PDF or Word format (max 5MB).
        </p>
      </div>

      <div 
        className="mt-8 flex justify-center px-6 pt-10 pb-10 border-2 border-[var(--color-border-medium)] border-dashed rounded-xl hover:border-[var(--color-accent-blue)] hover:bg-[rgba(0,212,255,0.05)] transition-all duration-300 relative group cursor-pointer"
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="space-y-2 text-center">
          <svg
            className="mx-auto h-12 w-12 text-[var(--color-text-disabled)] group-hover:text-[var(--color-accent-blue)] transition-colors animate-float"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex justify-center text-sm">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer font-medium text-[var(--color-accent-blue)] group-hover:text-[var(--color-accent-blue-dark)] focus-within:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".pdf,.docx,.doc"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isExtracting}
              />
            </label>
            <p className="pl-1 text-[var(--color-text-secondary)]">or drag and drop</p>
          </div>
          <p className="text-xs text-[var(--color-text-disabled)]">PDF or DOCX up to 5MB</p>
        </div>
      </div>

      {fileName && (
        <div className="mt-4 flex items-center justify-between p-4 bg-[rgba(0,212,255,0.1)] rounded-xl border border-[var(--color-accent-blue)] animate-slide-up">
          <div className="flex items-center">
            <span className="text-sm font-medium text-[var(--color-accent-blue)]">{fileName}</span>
          </div>
          {isExtracting && (
            <div className="flex items-center">
              <div className="animate-spin-slow rounded-full h-4 w-4 border-b-2 border-t-2 border-[var(--color-accent-blue)] mr-2"></div>
              <span className="text-xs text-[var(--color-accent-blue)]">Processing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
