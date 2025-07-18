import React, { useState } from 'react';
import { AlertCircle, ThumbsUp, ThumbsDown, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { useResourceVotes } from '../hooks/useResourceVotes';
import { useVerificationState } from '../hooks/useVerificationState';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface PendingVerificationProps {
  onResourceVerified?: (resourceId: string) => void;
}

function PendingVerification({ onResourceVerified }: PendingVerificationProps) {
  const { allResources, pendingEdits } = useResources();
  const { voteForVerification, loading } = useResourceVotes();
  const { hasCompletedVerification, addCompletedVerification } = useVerificationState();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(() => {
    // Load minimized state from localStorage
    return localStorage.getItem('verification-section-minimized') === 'true';
  });
  const [isIgnored, setIsIgnored] = useState(() => {
    // Load ignored state from localStorage
    return localStorage.getItem('verification-section-ignored') === 'true';
  });

  // Filter out admin-submitted resources and resources the user has already verified
  const pendingResources = allResources.filter(r => 
    r.verification_status === 'pending' && 
    !r.is_admin_submitted && // Exclude admin submissions - they don't need verification
    !hasCompletedVerification(r.id) && // Exclude user-completed verifications
    !hiddenItems.has(r.id)
  );

  // Filter out edits the user has already verified
  const filteredPendingEdits = pendingEdits.filter(e => 
    e.verification_status === 'pending' && // Only show pending edits
    !hasCompletedVerification(e.id) && 
    !hiddenItems.has(e.id)
  );

  // Save minimized state to localStorage
  const toggleMinimized = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('verification-section-minimized', newState.toString());
  };

  // Save ignored state to localStorage
  const handleIgnore = () => {
    setIsIgnored(true);
    localStorage.setItem('verification-section-ignored', 'true');
  };

  // Function to reset ignored state (for testing or if user wants to see it again)
  const handleShow = () => {
    setIsIgnored(false);
    setIsMinimized(false);
    localStorage.removeItem('verification-section-ignored');
    localStorage.removeItem('verification-section-minimized');
  };

  const handleVerificationVote = async (resourceId: string | null, editId: string | null, voteType: 'helpful' | 'unhelpful') => {
    const itemId = resourceId || editId;
    if (!itemId) return;

    // If voting helpful on an edit, approve it automatically
    if (editId && voteType === 'helpful') {
      const { approveEdit } = useResources();
      const result = await approveEdit(editId);
      
      if (result.success) {
        showToast('Edit approved and applied successfully!', 'success', 3000);
        addCompletedVerification(itemId);
        
        setTimeout(() => {
          setHiddenItems(prev => new Set([...prev, itemId]));
          setAnimatingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 800);
        return;
      } else {
        showToast(result.error || 'Failed to approve edit', 'error');
        return;
      }
    }

    console.log('Verification vote:', { resourceId, editId, voteType, itemId });
    // Start animation
    setAnimatingItems(prev => new Set([...prev, itemId]));

    const result = await voteForVerification(resourceId, editId, voteType);
    if (result.success) {
      console.log('Verification vote successful');
      
      // Show success feedback
      showToast(
        `Thank you for marking this ${voteType === 'helpful' ? 'helpful' : 'unhelpful'}!`,
        'success',
        2000
      );

      // Mark as completed for this user
      addCompletedVerification(itemId);
      
      // Notify parent component
      if (resourceId && onResourceVerified) {
        onResourceVerified(resourceId);
      }

      // Hide item after animation with smooth transition
      setTimeout(() => {
        setHiddenItems(prev => new Set([...prev, itemId]));
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 800); // Longer delay for smoother animation
    } else {
      console.error('Verification vote failed:', result.error);
      
      // Remove animation on error
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      // Handle specific case where user has already voted
      if (result.error && result.error.includes('already voted')) {
        console.warn('User has already voted for this verification:', result.error);
        showToast("You've already verified this item.", 'info', 2000);
        
        // Mark as completed for this user and hide the item
        addCompletedVerification(itemId);
        
        // Hide item after a short delay
        setTimeout(() => {
          setHiddenItems(prev => new Set([...prev, itemId]));
        }, 500);
      } else {
        console.error('Verification vote failed:', result.error);
        showToast(result.error || 'Failed to submit verification', 'error');
      }
    }
  };

  // Don't show if ignored or if there are no pending items
  if (isIgnored || (pendingResources.length === 0 && filteredPendingEdits.length === 0)) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-yellow-800">Help Verify New Content</h2>
          <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
            {pendingResources.length + filteredPendingEdits.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMinimized}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleIgnore}
            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors"
            title="Hide verification section"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <p className="text-yellow-700 mb-4">
            The community has submitted new resources and edits. Help us verify their accuracy!
          </p>

          <div className="space-y-4">
            {/* Pending Resources */}
            {pendingResources.map((resource) => (
              <div 
                key={resource.id} 
                className={`bg-white rounded-lg p-4 border border-yellow-200 transition-all duration-500 ${
                  animatingItems.has(resource.id) ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{resource.name}</h3>
                    <p className="text-sm text-gray-600">{resource.type} • {resource.address}</p>
                    <p className="text-sm text-gray-700 mt-2">{resource.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Submitted by community member</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleVerificationVote(resource.id, null, 'helpful')}
                      disabled={loading || animatingItems.has(resource.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      {animatingItems.has(resource.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Helpful ({resource.verification_votes})
                    </button>
                    <button
                      onClick={() => handleVerificationVote(resource.id, null, 'unhelpful')}
                      disabled={loading || animatingItems.has(resource.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      {animatingItems.has(resource.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                      Unhelpful
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pending Edits */}
            {filteredPendingEdits.map((edit) => (
              <div 
                key={edit.id} 
                className={`bg-white rounded-lg p-4 border border-yellow-200 transition-all duration-500 ${
                  animatingItems.has(edit.id) ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{edit.name} <span className="text-sm text-blue-600">(Edit)</span></h3>
                    <p className="text-sm text-gray-600">{edit.type} • {edit.address}</p>
                    <p className="text-sm text-gray-700 mt-2">{edit.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Edit suggestion from community</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleVerificationVote(null, edit.id, 'helpful')}
                      disabled={loading || animatingItems.has(edit.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      {animatingItems.has(edit.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Helpful ({edit.verification_votes})
                    </button>
                    <button
                      onClick={() => handleVerificationVote(null, edit.id, 'unhelpful')}
                      disabled={loading || animatingItems.has(edit.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200 disabled:opacity-50 hover:scale-105"
                    >
                      {animatingItems.has(edit.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                      Unhelpful
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PendingVerification;