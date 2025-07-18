import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Resource {
  id: string;
  name: string;
  type: string;
  category: string;
  address: string;
  contact?: string;
  email?: string;
  website?: string;
  description?: string;
  rating?: number;
  status?: 'Open' | 'Closed' | 'Open 24/7';
  hours?: string;
  services?: string[];
  is_user_submitted?: boolean;
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
  verification_status?: 'live' | 'pending' | 'rejected';
  helpful_votes?: number;
  unhelpful_votes?: number;
  verification_votes?: number;
  is_admin_submitted?: boolean;
}

export interface ResourceEdit {
  id: string;
  original_resource_id?: string;
  name: string;
  type: string;
  category: string;
  address: string;
  contact?: string;
  email?: string;
  website?: string;
  description?: string;
  rating?: number;
  status?: 'Open' | 'Closed' | 'Open 24/7';
  hours?: string;
  services?: string[];
  verification_status?: 'pending' | 'approved' | 'rejected';
  verification_votes?: number;
  created_at?: string;
  updated_at?: string;
  is_admin_submitted?: boolean;
}

export function useResources() {
  const [liveResources, setLiveResources] = useState<Resource[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [pendingEdits, setPendingEdits] = useState<ResourceEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalLiveCount, setTotalLiveCount] = useState(0);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('approved', true)
        .eq('verification_status', 'live')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLiveResources(data || []);
      setTotalLiveCount(data?.length || 0);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllResources(data || []);
      
      // Count only live resources for the counter
      const liveCount = data?.filter(r => r.verification_status === 'live' && r.approved).length || 0;
      setTotalLiveCount(liveCount);
    } catch (err) {
      console.error('Error fetching all resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEdits = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_edits')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingEdits(data || []);
    } catch (err) {
      console.error('Error fetching pending edits:', err);
    }
  };

  const deleteResource = async (id: string) => {
    try {
      console.log('Attempting to delete resource:', id);
      
      // Optimistic update - remove from UI immediately
      const originalLiveResources = [...liveResources];
      const originalAllResources = [...allResources];
      
      const updatedLiveResources = liveResources.filter(r => r.id !== id);
      const updatedAllResources = allResources.filter(r => r.id !== id);
      
      setLiveResources(updatedLiveResources);
      setAllResources(updatedAllResources);
      
      // Update count immediately
      const liveCount = updatedLiveResources.length;
      setTotalLiveCount(liveCount);

      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database deletion failed:', error);
        // Revert optimistic update on error
        setLiveResources(originalLiveResources);
        setAllResources(originalAllResources);
        const originalLiveCount = originalLiveResources.length;
        setTotalLiveCount(originalLiveCount);
        throw error;
      }

      console.log('Resource deleted successfully from database');
      return { success: true };
    } catch (error) {
      console.error('Error in deleteResource:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete resource' 
      };
    }
  };

  const approveResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ 
          verification_status: 'live',
          approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAllResources(prev => prev.map(r => 
        r.id === id 
          ? { ...r, verification_status: 'live' as const, approved: true }
          : r
      ));

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to approve resource' 
      };
    }
  };

  const rejectResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ 
          verification_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAllResources(prev => prev.map(r => 
        r.id === id 
          ? { ...r, verification_status: 'rejected' as const }
          : r
      ));

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reject resource' 
      };
    }
  };

  const addResource = async (resourceData: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([{
          ...resourceData,
          verification_status: 'pending',
          approved: false,
          is_user_submitted: true
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add resource' 
      };
    }
  };

  const submitResourceEdit = async (resourceId: string, editData: Omit<ResourceEdit, 'id' | 'original_resource_id' | 'created_at' | 'updated_at' | 'verification_status' | 'verification_votes'>) => {
    try {
      const { data, error } = await supabase
        .from('resource_edits')
        .insert([{
          ...editData,
          original_resource_id: resourceId,
          verification_status: 'pending',
          verification_votes: 0
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit edit' 
      };
    }
  };
  useEffect(() => {
    fetchResources();
    fetchPendingEdits();

    // Set up real-time subscription for resource changes
    const resourcesSubscription = supabase
      .channel('resources-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resources' 
        }, 
        (payload) => {
          console.log('Real-time resource change:', payload);
          
          if (payload.eventType === 'DELETE') {
            // Remove deleted resource from state
            setLiveResources(prev => prev.filter(r => r.id !== payload.old.id));
            setAllResources(prev => {
              const updated = prev.filter(r => r.id !== payload.old.id);
              const liveCount = updated.filter(r => r.verification_status === 'live' && r.approved).length;
              setTotalLiveCount(liveCount);
              return updated;
            });
          } else if (payload.eventType === 'INSERT') {
            // Add new resource
            const newResource = payload.new as Resource;
            setAllResources(prev => [newResource, ...prev]);
            
            if (newResource.approved && newResource.verification_status === 'live') {
              setLiveResources(prev => {
                const updated = [newResource, ...prev];
                setTotalLiveCount(updated.length);
                return updated;
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing resource
            const updatedResource = payload.new as Resource;
            setAllResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
            
            if (updatedResource.approved && updatedResource.verification_status === 'live') {
              setLiveResources(prev => {
                const updated = prev.map(r => r.id === updatedResource.id ? updatedResource : r);
                setTotalLiveCount(updated.length);
                return updated;
              });
            } else {
              // Remove from live resources if no longer live/approved
              setLiveResources(prev => {
                const updated = prev.filter(r => r.id !== updatedResource.id);
                setTotalLiveCount(updated.length);
                return updated;
              });
            }
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for resource edits
    const editsSubscription = supabase
      .channel('resource-edits-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resource_edits' 
        }, 
        (payload) => {
          console.log('Real-time edit change:', payload);
          
          if (payload.eventType === 'DELETE') {
            setPendingEdits(prev => prev.filter(e => e.id !== payload.old.id));
          } else if (payload.eventType === 'INSERT') {
            const newEdit = payload.new as ResourceEdit;
            if (newEdit.verification_status === 'pending') {
              setPendingEdits(prev => [newEdit, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedEdit = payload.new as ResourceEdit;
            setPendingEdits(prev => prev.map(e => e.id === updatedEdit.id ? updatedEdit : e));
          }
        }
      )
      .subscribe();

    return () => {
      resourcesSubscription.unsubscribe();
      editsSubscription.unsubscribe();
    };
  }, []);

  return {
    resources: liveResources, // For backward compatibility
    liveResources,
    allResources,
    pendingEdits,
    loading,
    error,
    totalLiveCount,
    fetchResources,
    fetchAllResources,
    deleteResource,
    approveResource,
    rejectResource,
    addResource,
    submitResourceEdit,
    refetch: fetchResources
  };
}