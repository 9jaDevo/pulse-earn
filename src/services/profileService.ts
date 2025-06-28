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
        .limit(1);

      console.log('[ProfileService] Profile fetch result:', { 
        success: !error, 
        hasData: !!data && data.length > 0, 
        errorCode: error?.code,
        errorMessage: error?.message
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Return the first profile if found, otherwise null
      const profile = data && data.length > 0 ? data[0] : null;
      return { data: profile, error: null };
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
        .limit(1);

      console.log('[ProfileService] Profile update result:', { 
        success: !error, 
        hasData: !!data && data.length > 0,
        errorMessage: error?.message
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Return the first profile if found, otherwise null
      const profile = data && data.length > 0 ? data[0] : null;
      return { data: profile, error: null };
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
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .limit(1);

      if (adminError) {
        return { 
          data: null, 
          error: adminError.message 
        };
      }

      const adminProfile = adminData && adminData.length > 0 ? adminData[0] : null;
      if (!adminProfile || adminProfile.role !== 'admin') {
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
      offset?: number;
      orderBy?: 'points' | 'created_at';
      order?: 'asc' | 'desc';
      role?: Profile['role'];
      country?: string;
    } = {}
  ): Promise<ServiceResponse<{
    profiles: Profile[];
    totalCount: number;
  }>> {
    console.log('[ProfileService] Fetching profiles with options:', options);
    try {
      const { limit = 50, offset = 0, orderBy = 'points', order = 'desc', role, country } = options;

      // Build the query for profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (role) {
        query = query.eq('role', role);
      }

      if (country) {
        query = query.eq('country', country);
      }

      // Get total count in a separate query
      let countQuery = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (role) {
        countQuery = countQuery.eq('role', role);
      }

      if (country) {
        countQuery = countQuery.eq('country', country);
      }

      // Run both queries in parallel
      const [profilesResult, countResult] = await Promise.all([
        query,
        countQuery
      ]);

      const { data, error } = profilesResult;
      const { count, error: countError } = countResult;

      console.log('[ProfileService] Profiles fetch result:', { 
        success: !error, 
        count: data?.length || 0,
        totalCount: count || 0,
        error: error?.message,
        countError: countError?.message
      });

      if (error) {
        return { data: null, error: error.message };
      }

      if (countError) {
        return { data: null, error: countError.message };
      }

      return { 
        data: { 
          profiles: data || [], 
          totalCount: count || 0 
        }, 
        error: null 
      };
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
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .limit(1);

      console.log('[ProfileService] Current profile fetch result:', { success: !fetchError, points: currentData && currentData.length > 0 ? currentData[0].points : null });
      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      // If no profile found, return error
      const currentProfile = currentData && currentData.length > 0 ? currentData[0] : null;
      if (!currentProfile) {
        console.log('[ProfileService] No profile found for user, returning error');
        return { data: null, error: 'User profile not found' };
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
        .limit(1);

      console.log('[ProfileService] Points update result:', { 
        success: !error, 
        newPoints: data && data.length > 0 ? data[0].points : null
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Return the first profile if found, otherwise null
      const profile = data && data.length > 0 ? data[0] : null;
      return { data: profile, error: null };
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
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('badges')
        .eq('id', userId)
        .limit(1);

      console.log('[ProfileService] Current profile badges fetch result:', { success: !fetchError, badges: currentData && currentData.length > 0 ? currentData[0].badges : null });
      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      const currentProfile = currentData && currentData.length > 0 ? currentData[0] : null;
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
        .limit(1);

      console.log('[ProfileService] Badge add result:', { 
        success: !error, 
        newBadges: data && data.length > 0 ? data[0].badges : null
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Return the first profile if found, otherwise null
      const profile = data && data.length > 0 ? data[0] : null;
      return { data: profile, error: null };
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
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .limit(1);

      console.log('[ProfileService] User points fetch result:', { success: !userError, points: userData && userData.length > 0 ? userData[0].points : null });
      if (userError) {
        return { data: null, error: userError.message };
      }

      // If no profile found, return rank 0
      const userProfile = userData && userData.length > 0 ? userData[0] : null;
      if (!userProfile) {
        console.log('[ProfileService] No profile found for user, returning rank 0');
        return { data: 0, error: null };
      }

      // Count users with more points
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
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