import { useState, useEffect } from 'react';

interface VerificationState {
  completedVerifications: Set<string>;
  addCompletedVerification: (itemId: string) => void;
  hasCompletedVerification: (itemId: string) => boolean;
}

export function useVerificationState(): VerificationState {
  const [completedVerifications, setCompletedVerifications] = useState<Set<string>>(new Set());

  // Load completed verifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('know-borivali-completed-verifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCompletedVerifications(new Set(parsed));
      } catch (error) {
        console.error('Error loading verification state:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(
      'know-borivali-completed-verifications', 
      JSON.stringify(Array.from(completedVerifications))
    );
  }, [completedVerifications]);

  const addCompletedVerification = (itemId: string) => {
    setCompletedVerifications(prev => new Set([...prev, itemId]));
  };

  const hasCompletedVerification = (itemId: string) => {
    return completedVerifications.has(itemId);
  };

  return {
    completedVerifications,
    addCompletedVerification,
    hasCompletedVerification
  };
}