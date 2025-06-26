import { supabase, Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Profile Service
 * 
 * This service abstracts all profile-related database operations.
 * When migrating to a Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class ProfileService {
  /**
   * Fetch a profile by user ID
   */
  static async fetchProfileById(userId: string): Promise<ServiceResponse<Profile>> {
    try {
      console.log('[ProfileService] Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('[ProfileService] Profile fetch result:', { 
        success: !error, 
        hasData: !!data, 
        errorCode: error?.code,
        errorMessage: error?.message
      });

      if (error) {
        // Handle the specific case where no profile exists (PGRST116 with 0 rows)
        if (error.code === 'PGRST116') {
          console.log('[ProfileService] No profile found (PGRST116), returning null without error');
          return { data: null, error: null };
        }
        return { data: null, error: error.message };
      }

      if (!data) {
        console.warn('[ProfileService] No profile data returned but no error either');
      }

      return { data, error: null };
    } catch (error) {
      console.error('[ProfileService] Exception in fetchProfileById:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  /**
   * Create a new profile
   */
  static async createProfile(profileData: ProfileInsert): Promise<ServiceResponse<Profile>> {
    try {
      console.log('[ProfileService] Creating new profile:', profileData.id);
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      console.log('[ProfileService] Profile creation result:', { 
        success: !error, 
        hasData: !!data,
        errorMessage: error?.message
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      };
    }
  }

  /**
   * Update a user's profile
   */
  static async updateUserProfile(
    userId: string, 
    updates: ProfileUpdate
  ): Promise<ServiceResponse<Profile>> {
    console.log('[ProfileService] Updating profile for user:', userId, 'with updates:', updates);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      console.log('[ProfileService] Profile update result:', { 
        success: !error, 
        hasData: !!data,
        errorMessage: error?.message
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  /**
   * Admin update of a user's profile
   * This allows admins to update any user's profile including role and suspension status
   */
  static async adminUpdateUserProfile(
    adminId: string,
    userId: string,
    updates: ProfileUpdate
  ): Promise<ServiceResponse<Profile>> {
    console.log('[ProfileService] Admin updating profile for user:', userId, 'by admin:', adminId, 'with updates:', updates);
    try {
      // First check if the requesting user is an admin
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .single();

      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { 
          data: null, 
          error: 'Unauthorized: Only admins can perform this action' 
        };
      }

      // Perform the update
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      console.log('[ProfileService] Admin profile update result:', { 
        success: !error, 
        hasData: !!data,
        errorMessage: error?.message
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Log the admin action
      await supabase
        .from('moderator_actions')
        .insert({
          moderator_id: adminId,
          action_type: 'update_user_profile',
          target_id: userId,
          target_table: 'profiles',
          reason: 'Admin user profile update',
          metadata: { 
            updates: { ...updates },
            suspended: updates.is_suspended !== undefined ? updates.is_suspended : null,
            role_change: updates.role !== undefined ? updates.role : null
          }
        });

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update user profile' 
      };
    }
  }

  /**
   * Fetch multiple profiles (for leaderboards, etc.)
   */
  static async fetchProfiles(
    options: {
      limit?: number;
      orderBy?: 'points' | 'created_at';
      order?: 'asc' | 'desc';
      role?: Profile['role'];
      country?: string;
    } = {}
  ): Promise<ServiceResponse<Profile[]>> {
    console.log('[ProfileService] Fetching profiles with options:', options);
    try {
      const { limit = 50, orderBy = 'points', order = 'desc', role, country } = options;

      let query = supabase
        .from('profiles')
        .select('*')
        .order(orderBy, { ascending: order === 'asc' })
        .limit(limit);

      if (role) {
        query = query.eq('role', role);
      }

      if (country) {
        query = query.eq('country', country);
      }

      const { data, error } = await query;

      console.log('[ProfileService] Profiles fetch result:', { 
        success: !error, 
        count: data?.length || 0
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch profiles' 
      };
    }
  }

  /**
   * Update user points
   */
  static async updateUserPoints(
    userId: string, 
    pointsToAdd: number
  ): Promise<ServiceResponse<Profile>> {
    console.log('[ProfileService] Updating points for user:', userId, 'adding points:', pointsToAdd);
    try {
      // First fetch current points
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      console.log('[ProfileService] Current profile fetch result:', { success: !fetchError, points: currentProfile?.points });
      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      const newPoints = (currentProfile?.points || 0) + pointsToAdd;

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          points: newPoints,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      console.log('[ProfileService] Points update result:', { 
        success: !error, 
        newPoints: data?.points
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update points' 
      };
    }
  }

  /**
   * Add badge to user
   */
  static async addBadgeToUser(
    userId: string, 
    badge: string
  ): Promise<ServiceResponse<Profile>> {
    console.log('[ProfileService] Adding badge to user:', userId, 'badge:', badge);
    try {
      // First fetch current badges
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('badges')
        .eq('id', userId)
        .single();

      console.log('[ProfileService] Current profile badges fetch result:', { success: !fetchError, badges: currentProfile?.badges });
      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      const currentBadges = currentProfile?.badges || [];
      
      // Don't add duplicate badges
      if (currentBadges.includes(badge)) {
        console.log('[ProfileService] Badge already exists for user');
        return { data: null, error: 'Badge already exists' };
      }

      const newBadges = [...currentBadges, badge];

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          badges: newBadges,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      console.log('[ProfileService] Badge add result:', { 
        success: !error, 
        newBadges: data?.badges
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to add badge' 
      };
    }
  }

  /**
   * Search profiles by name or email
   */
  static async searchProfiles(
    searchTerm: string, 
    limit: number = 20
  ): Promise<ServiceResponse<Profile[]>> {
    console.log('[ProfileService] Searching profiles with term:', searchTerm);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(limit);

      console.log('[ProfileService] Profile search result:', { 
        success: !error, 
        count: data?.length || 0
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to search profiles' 
      };
    }
  }

  /**
   * Get user rank based on points
   */
  static async getUserRank(userId: string): Promise<ServiceResponse<number>> {
    console.log('[ProfileService] Getting rank for user:', userId);
    try {
      // Get user's points first
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      console.log('[ProfileService] User points fetch result:', { success: !userError, points: userProfile?.points });
      if (userError) {
        return { data: null, error: userError.message };
      }

      // Count users with more points
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('points', userProfile.points);

      console.log('[ProfileService] Rank calculation result:', { success: !countError, usersWithMorePoints: count });
      if (countError) {
        return { data: null, error: countError.message };
      }

      // Rank is count + 1 (users with more points + 1)
      const rank = (count || 0) + 1;

      console.log('[ProfileService] Final rank:', rank);
      return { data: rank, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get user rank' 
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  fetchProfileById,
  createProfile,
  updateUserProfile,
  adminUpdateUserProfile,
  fetchProfiles,
  updateUserPoints,
  addBadgeToUser,
  searchProfiles,
  getUserRank
} = ProfileService;