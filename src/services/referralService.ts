import { supabase } from '../lib/supabase';
import { SettingsService } from './settingsService';
import type { ServiceResponse } from './profileService';

export interface ReferralStats {
  totalReferrals: number;
  totalEarnedFromReferrals: number;
  recentReferrals: number;
}

export interface ReferralHistory {
  id: string;
  user_id: string;
  reward_type: 'referral_signup' | 'referral_bonus';
  points_earned: number;
  reward_data: {
    referrer_id?: string;
    referred_user_id?: string;
  };
  created_at: string;
}

/**
 * Referral Service
 * 
 * This service handles all referral-related operations including:
 * - Getting referral statistics
 * - Fetching referral history
 * - Validating referral codes
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class ReferralService {
  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<ServiceResponse<ReferralStats>> {
    try {
      const { data, error } = await supabase
        .rpc('get_referral_stats', { p_user_id: userId });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data[0] || { totalReferrals: 0, totalEarnedFromReferrals: 0, recentReferrals: 0 }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get referral statistics'
      };
    }
  }

  /**
   * Get referral history for a user
   */
  static async getReferralHistory(
    userId: string,
    options: {
      limit?: number;
      type?: 'referral_signup' | 'referral_bonus';
    } = {}
  ): Promise<ServiceResponse<ReferralHistory[]>> {
    try {
      const { limit = 50, type } = options;

      let query = supabase
        .from('daily_reward_history')
        .select('*')
        .eq('user_id', userId)
        .in('reward_type', type ? [type] : ['referral_signup', 'referral_bonus'])
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get referral history'
      };
    }
  }

  /**
   * Validate a referral code
   */
  static async validateReferralCode(referralCode: string): Promise<ServiceResponse<{
    valid: boolean;
    referrerName?: string;
    referrerId?: string;
  }>> {
    try {
      if (!referralCode || referralCode.trim().length === 0) {
        return { data: { valid: false }, error: null };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message };
      }

      if (!data) {
        return { data: { valid: false }, error: null };
      }

      return {
        data: {
          valid: true,
          referrerName: data.name || 'Anonymous User',
          referrerId: data.id
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to validate referral code'
      };
    }
  }

  /**
   * Process referral bonus for a new user signup
   */
  static async processReferralBonus(
    referrerId: string,
    newUserId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Get referral bonus points from settings
      const { data: pointsSettings } = await SettingsService.getSettings('points');
      const referralBonusPoints = pointsSettings?.referralBonusPoints || 100; // Default to 100 if not set

      // Award points to the referrer
      const { error: pointsError } = await supabase.rpc('award_referral_bonus', {
        p_referrer_id: referrerId,
        p_referred_id: newUserId,
        p_bonus_points: referralBonusPoints
      });

      if (pointsError) {
        return { data: null, error: pointsError.message };
      }

      // Record in history for both users
      await Promise.all([
        // Record for referrer
        supabase.from('daily_reward_history').insert({
          user_id: referrerId,
          reward_type: 'referral_bonus',
          points_earned: referralBonusPoints,
          reward_data: { referred_user_id: newUserId }
        }),
        
        // Record for new user
        supabase.from('daily_reward_history').insert({
          user_id: newUserId,
          reward_type: 'referral_signup',
          points_earned: referralBonusPoints,
          reward_data: { referrer_id: referrerId }
        })
      ]);

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to process referral bonus'
      };
    }
  }

  /**
   * Get users referred by a specific user
   */
  static async getReferredUsers(
    userId: string,
    options: {
      limit?: number;
      orderBy?: 'created_at' | 'points';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ServiceResponse<Array<{
    id: string;
    name: string | null;
    email: string;
    points: number;
    created_at: string;
  }>>> {
    try {
      const { limit = 50, orderBy = 'created_at', order = 'desc' } = options;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, points, created_at')
        .eq('referred_by', userId)
        .order(orderBy, { ascending: order === 'asc' })
        .limit(limit);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get referred users'
      };
    }
  }

  /**
   * Get referral leaderboard
   */
  static async getReferralLeaderboard(
    options: {
      limit?: number;
      timeframe?: 'all' | 'month' | 'week';
    } = {}
  ): Promise<ServiceResponse<Array<{
    id: string;
    name: string | null;
    referral_count: number;
    total_earned: number;
  }>>> {
    try {
      const { limit = 50, timeframe = 'all' } = options;

      let timeFilter = '';
      if (timeframe === 'month') {
        timeFilter = "AND p2.created_at > NOW() - INTERVAL '30 days'";
      } else if (timeframe === 'week') {
        timeFilter = "AND p2.created_at > NOW() - INTERVAL '7 days'";
      }

      const query = `
        SELECT 
          p1.id,
          p1.name,
          COUNT(p2.id)::INTEGER as referral_count,
          COALESCE(SUM(drh.points_earned), 0)::INTEGER as total_earned
        FROM profiles p1
        LEFT JOIN profiles p2 ON p1.id = p2.referred_by ${timeFilter}
        LEFT JOIN daily_reward_history drh ON p1.id = drh.user_id AND drh.reward_type = 'referral_bonus'
        WHERE p1.referral_code IS NOT NULL
        GROUP BY p1.id, p1.name
        HAVING COUNT(p2.id) > 0
        ORDER BY referral_count DESC, total_earned DESC
        LIMIT ${limit}
      `;

      const { data, error } = await supabase.rpc('execute_sql', { query });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get referral leaderboard'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getReferralStats,
  getReferralHistory,
  validateReferralCode,
  getReferredUsers,
  getReferralLeaderboard,
  processReferralBonus
} = ReferralService;