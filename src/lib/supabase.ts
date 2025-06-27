import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing Supabase client with:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Add debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth state change:', event, 'Session:', session ? 'exists' : 'null');
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          country: string | null;
          role: 'user' | 'moderator' | 'ambassador' | 'admin';
          points: number;
          badges: string[];
          referral_code: string | null;
          referred_by: string | null;
          created_at: string;
          updated_at: string;
          is_suspended: boolean;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          role?: 'user' | 'moderator' | 'ambassador' | 'admin';
          points?: number;
          badges?: string[];
          referral_code?: string | null;
          referred_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_suspended?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          role?: 'user' | 'moderator' | 'ambassador' | 'admin';
          points?: number;
          badges?: string[];
          referral_code?: string | null;
          referred_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_suspended?: boolean;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_url: string | null;
          criteria: any; // jsonb
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon_url?: string | null;
          criteria?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon_url?: string | null;
          criteria?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      polls: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          options: any[]; // jsonb array
          type: 'global' | 'country';
          country: string | null;
          slug: string;
          created_by: string;
          active_until: string | null;
          is_active: boolean;
          total_votes: number;
          created_at: string;
          updated_at: string;
          category: string;
          start_date: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          options: any[];
          type?: 'global' | 'country';
          country?: string | null;
          slug: string;
          created_by: string;
          active_until?: string | null;
          is_active?: boolean;
          total_votes?: number;
          created_at?: string;
          updated_at?: string;
          category?: string;
          start_date?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          options?: any[];
          type?: 'global' | 'country';
          country?: string | null;
          slug?: string;
          created_by?: string;
          active_until?: string | null;
          is_active?: boolean;
          total_votes?: number;
          created_at?: string;
          updated_at?: string;
          category?: string;
          start_date?: string | null;
        };
      };
      poll_votes: {
        Row: {
          id: string;
          user_id: string;
          poll_id: string;
          vote_option: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          poll_id: string;
          vote_option: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          poll_id?: string;
          vote_option?: number;
          created_at?: string;
        };
      };
      moderator_actions: {
        Row: {
          id: string;
          moderator_id: string;
          action_type: string;
          target_id: string;
          target_table: string;
          reason: string | null;
          metadata: any; // jsonb
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          action_type: string;
          target_id: string;
          target_table: string;
          reason?: string | null;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          action_type?: string;
          target_id?: string;
          target_table?: string;
          reason?: string | null;
          metadata?: any;
          created_at?: string;
        };
      };
      ambassadors: {
        Row: {
          id: string;
          user_id: string;
          country: string;
          commission_rate: number;
          is_active: boolean;
          total_referrals: number;
          total_earnings: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          country: string;
          commission_rate?: number;
          is_active?: boolean;
          total_referrals?: number;
          total_earnings?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          country?: string;
          commission_rate?: number;
          is_active?: boolean;
          total_referrals?: number;
          total_earnings?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      country_metrics: {
        Row: {
          id: string;
          country: string;
          metric_date: string;
          ad_revenue: number;
          user_count: number;
          new_users: number;
          total_points_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          country: string;
          metric_date: string;
          ad_revenue?: number;
          user_count?: number;
          new_users?: number;
          total_points_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          country?: string;
          metric_date?: string;
          ad_revenue?: number;
          user_count?: number;
          new_users?: number;
          total_points_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      poll_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      redeemed_items: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          item_name: string;
          points_cost: number;
          status: string;
          fulfillment_details: any; // jsonb
          redeemed_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          item_name: string;
          points_cost: number;
          status?: string;
          fulfillment_details?: any;
          redeemed_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          item_name?: string;
          points_cost?: number;
          status?: string;
          fulfillment_details?: any;
          redeemed_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};