import { useState, useEffect } from 'react';

interface VoteState {
  votedResources: Set<string>;
  addVotedResource: (resourceId: string) => void;
  hasVoted: (resourceId: string) => boolean;
}

export function useVoteState(): VoteState {
  const [votedResources, setVotedResources] = useState<Set<string>>(new Set());

  // Load voted resources from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('know-borivali-voted-resources');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVotedResources(new Set(parsed));
      } catch (error) {
        console.error('Error loading vote state:', error);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(
      'know-borivali-voted-resources', 
      JSON.stringify(Array.from(votedResources))
    );
  }, [votedResources]);

  const addVotedResource = (resourceId: string) => {
    setVotedResources(prev => new Set([...prev, resourceId]));
  };

  const hasVoted = (resourceId: string) => {
    return votedResources.has(resourceId);
  };

  return {
    votedResources,
    addVotedResource,
    hasVoted
  };
}