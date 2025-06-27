import { supabase, Database } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';

type Badge = Database['public']['Tables']['badges']['Row'];
type BadgeInsert = Database['public']['Tables']['badges']['Insert'];
type BadgeUpdate = Database['public']['Tables']['badges']['Update'];

export interface BadgeCriteria {
  type: string;
  count?: number;
  difficulty?: string;
  before?: string;
  [key: string]: any;
}

export interface UserBadgeProgress {
  badge: Badge;
  earned: boolean;
  progress: number;
  maxProgress: number;
  earnedAt?: string;
}

/**
 * Badge Service
 * 
 * This service handles all badge-related operations including:
 * - Fetching available badges
 * - Checking badge criteria and awarding badges
 * - Managing user badge progress
 * - Badge creation and management (admin)
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class BadgeService {
  /**
   * Fetch all active badges
   */
  static async fetchBadges(): Promise<ServiceResponse<Badge[]>> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch badges'
      };
    }
  }

  /**
   * Fetch a single badge by ID
   */
  static async fetchBadgeById(badgeId: string): Promise<ServiceResponse<Badge>> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('id', badgeId)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch badge'
      };
    }
  }

  /**
   * Create a new badge (admin only)
   */
  static async createBadge(badgeData: BadgeInsert): Promise<ServiceResponse<Badge>> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert(badgeData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create badge'
      };
    }
  }

  /**
   * Update a badge (admin only)
   */
  static async updateBadge(
    badgeId: string,
    updates: BadgeUpdate
  ): Promise<ServiceResponse<Badge>> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', badgeId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update badge'
      };
    }
  }

  /**
   * Get user's badge progress
   */
  static async getUserBadgeProgress(userId: string): Promise<ServiceResponse<UserBadgeProgress[]>> {
    try {
      // Get all active badges
      const { data: badges, error: badgesError } = await this.fetchBadges();
      if (badgesError || !badges) {
        return { data: null, error: badgesError || 'Failed to fetch badges' };
      }

      // Get user profile for current badges and stats
      const { data: profile, error: profileError } = await ProfileService.fetchProfileById(userId);
      if (profileError || !profile) {
        return { data: null, error: profileError || 'Failed to fetch user profile' };
      }

      // Get user statistics for progress calculation
      const userStats = await this.getUserStatistics(userId);

      const badgeProgress: UserBadgeProgress[] = badges.map(badge => {
        const criteria = badge.criteria as BadgeCriteria;
        const earned = profile.badges.includes(badge.name);
        const earnedAt = earned ? profile.updated_at : undefined; // Simplified - in real app, track individual badge dates

        let progress = 0;
        let maxProgress = 1;

        if (!earned) {
          // Calculate progress based on criteria
          switch (criteria.type) {
            case 'poll_votes':
              progress = Math.min(userStats.pollVotes, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'polls_created':
              progress = Math.min(userStats.pollsCreated, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'trivia_completed':
              progress = Math.min(userStats.triviaCompleted, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'trivia_perfect':
              // This would require additional data tracking in the database
              // For now, we'll use a simplified approach
              progress = userStats.perfectTriviaGames;
              maxProgress = 1;
              break;
            case 'total_points':
              progress = Math.min(profile.points, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'login_streak':
              progress = Math.min(userStats.currentStreak, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'spin_wins':
              progress = Math.min(userStats.spinWins, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'spin_jackpot':
              progress = Math.min(userStats.jackpotSpins, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'ads_watched':
              progress = Math.min(userStats.adsWatched, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'referrals':
              progress = Math.min(userStats.referrals, criteria.count || 1);
              maxProgress = criteria.count || 1;
              break;
            case 'early_adopter':
              // Check if user joined before the specified date
              if (criteria.before) {
                const beforeDate = new Date(criteria.before);
                const userCreatedAt = new Date(profile.created_at);
                progress = userCreatedAt < beforeDate ? 1 : 0;
              }
              maxProgress = 1;
              break;
            default:
              progress = 0;
              maxProgress = 1;
          }
        } else {
          progress = maxProgress;
        }

        return {
          badge,
          earned,
          progress,
          maxProgress,
          earnedAt
        };
      });

      return { data: badgeProgress, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user badge progress'
      };
    }
  }

  /**
   * Check and award badges to user
   */
  static async checkAndAwardBadges(userId: string): Promise<ServiceResponse<string[]>> {
    try {
      // Get user's current badge progress
      const { data: badgeProgress, error: progressError } = await this.getUserBadgeProgress(userId);
      if (progressError || !badgeProgress) {
        return { data: null, error: progressError || 'Failed to get badge progress' };
      }

      // Find badges that should be awarded
      const badgesToAward = badgeProgress
        .filter(bp => !bp.earned && bp.progress >= bp.maxProgress)
        .map(bp => bp.badge.name);

      if (badgesToAward.length === 0) {
        return { data: [], error: null };
      }

      // Award badges to user
      for (const badgeName of badgesToAward) {
        const { error } = await ProfileService.addBadgeToUser(userId, badgeName);
        if (error) {
          console.error(`Failed to award badge ${badgeName} to user ${userId}:`, error);
        }
      }

      return { data: badgesToAward, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check and award badges'
      };
    }
  }

  /**
   * Get user statistics for badge progress calculation
   */
  private static async getUserStatistics(userId: string): Promise<{
    pollVotes: number;
    pollsCreated: number;
    triviaCompleted: number;
    perfectTriviaGames: number;
    currentStreak: number;
    spinWins: number;
    jackpotSpins: number;
    adsWatched: number;
    referrals: number;
  }> {
    try {
      // Get poll votes count
      const { count: pollVotes } = await supabase
        .from('poll_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get polls created count
      const { count: pollsCreated } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      // Get daily rewards data
      const { data: dailyRewards } = await supabase
        .from('user_daily_rewards')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get trivia history count
      const { count: triviaCompleted } = await supabase
        .from('daily_reward_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reward_type', 'trivia');

      // Get perfect trivia games count (score = 100% on hard difficulty)
      const { count: perfectTriviaGames } = await supabase
        .from('daily_reward_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reward_type', 'trivia')
        .contains('reward_data', { score: 100, difficulty: 'hard' });

      // Get spin wins count (successful spins)
      const { count: spinWins } = await supabase
        .from('daily_reward_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reward_type', 'spin')
        .gt('points_earned', 0);

      // Get jackpot spins count (250 points)
      const { count: jackpotSpins } = await supabase
        .from('daily_reward_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reward_type', 'spin')
        .eq('points_earned', 250);

      // Get referrals count
      const { count: referrals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', userId);

      return {
        pollVotes: pollVotes || 0,
        pollsCreated: pollsCreated || 0,
        triviaCompleted: triviaCompleted || 0,
        perfectTriviaGames: perfectTriviaGames || 0,
        currentStreak: dailyRewards?.trivia_streak || 0,
        spinWins: spinWins || 0,
        jackpotSpins: jackpotSpins || 0,
        adsWatched: dailyRewards?.total_ads_watched || 0,
        referrals: referrals || 0
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        pollVotes: 0,
        pollsCreated: 0,
        triviaCompleted: 0,
        perfectTriviaGames: 0,
        currentStreak: 0,
        spinWins: 0,
        jackpotSpins: 0,
        adsWatched: 0,
        referrals: 0
      };
    }
  }

  /**
   * Get badge statistics
   */
  static async getBadgeStats(): Promise<ServiceResponse<{
    totalBadges: number;
    activeBadges: number;
    mostEarnedBadge: { name: string; count: number } | null;
  }>> {
    try {
      // Get total badges
      const { count: totalBadges } = await supabase
        .from('badges')
        .select('*', { count: 'exact', head: true });

      // Get active badges
      const { count: activeBadges } = await supabase
        .from('badges')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get most earned badge (simplified - would need proper tracking in real app)
      const { data: badges } = await supabase
        .from('badges')
        .select('name')
        .eq('is_active', true);

      let mostEarnedBadge = null;
      if (badges && badges.length > 0) {
        // For now, just return the first badge as most earned
        // In a real implementation, you'd query user badges to find the most common
        mostEarnedBadge = {
          name: badges[0].name,
          count: 0 // Would be calculated from user badge data
        };
      }

      return {
        data: {
          totalBadges: totalBadges || 0,
          activeBadges: activeBadges || 0,
          mostEarnedBadge
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get badge statistics'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  fetchBadges,
  fetchBadgeById,
  createBadge,
  updateBadge,
  getUserBadgeProgress,
  checkAndAwardBadges,
  getBadgeStats
} = BadgeService;