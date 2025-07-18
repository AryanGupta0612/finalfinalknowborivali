import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      resources: {
        Row: {
          id: string;
          name: string;
          type: string;
          category: string;
          address: string;
          contact: string | null;
          email: string | null;
          website: string | null;
          description: string | null;
          rating: number;
          status: 'Open' | 'Closed' | 'Open 24/7';
          hours: string | null;
          services: string[] | null;
          is_user_submitted: boolean;
          is_admin_submitted: boolean;
          approved: boolean;
          verification_status: 'live' | 'pending' | 'rejected';
          helpful_votes: number;
          unhelpful_votes: number;
          verification_votes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          category: string;
          address: string;
          contact?: string | null;
          email?: string | null;
          website?: string | null;
          description?: string | null;
          rating?: number;
          status?: 'Open' | 'Closed' | 'Open 24/7';
          hours?: string | null;
          services?: string[] | null;
          is_user_submitted?: boolean;
          is_admin_submitted?: boolean;
          approved?: boolean;
          verification_status?: 'live' | 'pending' | 'rejected';
          helpful_votes?: number;
          unhelpful_votes?: number;
          verification_votes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          category?: string;
          address?: string;
          contact?: string | null;
          email?: string | null;
          website?: string | null;
          description?: string | null;
          rating?: number;
          status?: 'Open' | 'Closed' | 'Open 24/7';
          hours?: string | null;
          services?: string[] | null;
          is_user_submitted?: boolean;
          is_admin_submitted?: boolean;
          approved?: boolean;
          verification_status?: 'live' | 'pending' | 'rejected';
          verification_votes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      resource_votes: {
        Row: {
          id: string;
          resource_id: string;
          voter_ip: string;
          vote_type: 'helpful' | 'unhelpful';
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          voter_ip: string;
          vote_type: 'helpful' | 'unhelpful';
          created_at?: string;
        };
        Update: {
          id?: string;
          resource_id?: string;
          voter_ip?: string;
          vote_type?: 'helpful' | 'unhelpful';
          created_at?: string;
        };
      };
      verification_votes: {
        Row: {
          id: string;
          resource_id: string | null;
          edit_id: string | null;
          voter_ip: string;
          vote_type: 'helpful' | 'unhelpful';
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id?: string | null;
          edit_id?: string | null;
          voter_ip: string;
          vote_type: 'helpful' | 'unhelpful';
          created_at?: string;
        };
        Update: {
          id?: string;
          resource_id?: string | null;
          edit_id?: string | null;
          voter_ip?: string;
          vote_type?: 'helpful' | 'unhelpful';
          created_at?: string;
        };
      };
    };
  };
};