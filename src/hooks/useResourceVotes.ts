import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface VoteResult {
  success: boolean;
  error?: string;
  newCounts?: {
    helpful_votes: number;
    unhelpful_votes: number;
  };
}

export function useResourceVotes() {
  const [loading, setLoading] = useState(false);

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
    }
  };

  const voteForResource = async (resourceId: string, voteType: 'helpful' | 'unhelpful'): Promise<VoteResult> => {
    try {
      setLoading(true);
      const voterIP = await getClientIP();

      console.log('Attempting to vote for resource:', resourceId, 'vote type:', voteType, 'voter IP:', voterIP);

      // Check if user already voted
      const { data: existingVotes, error: checkError } = await supabase
        .from('resource_votes')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('voter_ip', voterIP);

      if (checkError) {
        console.error('Error checking existing votes:', checkError);
        return { success: false, error: 'Failed to check existing votes' };
      }

      if (existingVotes && existingVotes.length > 0) {
        console.log('User already voted for this resource');
        return { success: false, error: 'You have already voted for this resource' };
      }

      // Insert vote
      const { error } = await supabase
        .from('resource_votes')
        .insert({
          resource_id: resourceId,
          voter_ip: voterIP,
          vote_type: voteType
        });

      if (error) {
        console.error('Error inserting vote:', error);
        throw error;
      }

      console.log('Vote submitted successfully for resource:', resourceId);
      
      // Wait for database trigger to process the vote count update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get updated vote counts directly from database
      const { data: updatedResource, error: fetchError } = await supabase
        .from('resources')
        .select('helpful_votes, unhelpful_votes')
        .eq('id', resourceId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated counts:', fetchError);
        // Still return success even if we can't fetch updated counts
        return { success: true };
      }
      
      console.log('Updated vote counts:', updatedResource);
      
      return { 
        success: true, 
        newCounts: updatedResource ? {
          helpful_votes: updatedResource.helpful_votes || 0,
          unhelpful_votes: updatedResource.unhelpful_votes || 0
        } : undefined
      };
    } catch (error: any) {
      console.error('Error voting for resource:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const voteForVerification = async (resourceId: string | null, editId: string | null, voteType: 'helpful' | 'unhelpful'): Promise<VoteResult> => {
    try {
      setLoading(true);
      const voterIP = await getClientIP();

      console.log('Attempting verification vote:', { resourceId, editId, voteType, voterIP });
      // Check if user already voted
      const { data: existingVotes, error: checkError } = await supabase
        .from('verification_votes')
        .select('*')
        .eq('voter_ip', voterIP)
        .eq(resourceId ? 'resource_id' : 'edit_id', resourceId || editId);

      if (checkError) {
        console.error('Error checking existing verification votes:', checkError);
        return { success: false, error: 'Failed to check existing votes' };
      }

      if (existingVotes && existingVotes.length > 0) {
        console.log('User already voted for this verification');
        return { success: false, error: 'You have already voted for this verification' };
      }

      // Insert verification vote
      const { error } = await supabase
        .from('verification_votes')
        .insert({
          resource_id: resourceId,
          edit_id: editId,
          voter_ip: voterIP,
          vote_type: voteType
        });

      if (error) {
        console.error('Error inserting verification vote:', error);
        throw error;
      }

      console.log('Verification vote submitted successfully');
      
      // Wait for database trigger to process
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    } catch (error: any) {
      console.error('Error voting for verification:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time vote count changes for a resource
  let voteSubscription: any = null;
  const subscribeToResourceVotes = (resourceId: string, onUpdate: (counts: { helpful_votes: number, unhelpful_votes: number }) => void) => {
    voteSubscription = supabase
      .channel('resource-votes-' + resourceId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resources',
          filter: `id=eq.${resourceId}`
        },
        (payload) => {
          const newRow = payload.new;
          if (newRow) {
            onUpdate({
              helpful_votes: newRow.helpful_votes,
              unhelpful_votes: newRow.unhelpful_votes
            });
          }
        }
      )
      .subscribe();
  };

  // Unsubscribe from real-time updates
  const unsubscribeFromResourceVotes = async () => {
    if (voteSubscription) {
      await supabase.removeChannel(voteSubscription);
      voteSubscription = null;
    }
  };

  return { voteForResource, voteForVerification, loading, subscribeToResourceVotes, unsubscribeFromResourceVotes };
}