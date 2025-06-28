import { supabase } from '../lib/supabase';
import type { ServiceResponse } from './profileService';

/**
 * Admin Service
 * 
 * This service handles all admin-related operations including:
 * - Dashboard statistics and analytics
 * - User management
 * - Content moderation
 * - System settings
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class AdminService {
  /**
   * Get platform overview statistics with date filtering
   */
  static async getPlatformStats(options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ServiceResponse<{
    totalUsers: number;
    activeUsers: number;
    totalPolls: number;
    totalVotes: number;
    totalPoints: number;
    recentSignups: number;
  }>> {
    try {
      const { startDate, endDate } = options;
      
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) {
        return { data: null, error: usersError.message };
      }
      
      // Get active users (users who have activity in the last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers, error: activeError } = await supabase
        .from('daily_reward_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(1);
      
      if (activeError) {
        return { data: null, error: activeError.message };
      }
      
      // Get total polls
      const { count: totalPolls, error: pollsError } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true });
      
      if (pollsError) {
        return { data: null, error: pollsError.message };
      }
      
      // Get total votes
      const { count: totalVotes, error: votesError } = await supabase
        .from('poll_votes')
        .select('*', { count: 'exact', head: true });
      
      if (votesError) {
        return { data: null, error: votesError.message };
      }
      
      // Get total points
      const { data: pointsData, error: pointsError } = await supabase
        .from('profiles')
        .select('points');
      
      if (pointsError) {
        return { data: null, error: pointsError.message };
      }
      
      const totalPoints = pointsData?.reduce((sum, profile) => sum + profile.points, 0) || 0;
      
      // Get recent signups within date range
      let signupsQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (startDate) {
        signupsQuery = signupsQuery.gte('created_at', startDate);
      } else {
        // Default to last 30 days if no start date provided
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        signupsQuery = signupsQuery.gte('created_at', thirtyDaysAgo.toISOString());
      }
      
      if (endDate) {
        signupsQuery = signupsQuery.lte('created_at', endDate);
      }
      
      const { count: recentSignups, error: signupsError } = await signupsQuery;
      
      if (signupsError) {
        return { data: null, error: signupsError.message };
      }
      
      return {
        data: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalPolls: totalPolls || 0,
          totalVotes: totalVotes || 0,
          totalPoints,
          recentSignups: recentSignups || 0
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get platform stats'
      };
    }
  }

  /**
   * Get recent activity for admin dashboard with date filtering
   */
  static async getRecentActivity(
    limit: number = 10,
    options: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ServiceResponse<Array<{
    type: 'user' | 'poll' | 'moderation' | 'system';
    message: string;
    time: string;
    timestamp: Date;
  }>>> {
    try {
      const { startDate, endDate } = options;
      
      // Get recent user registrations
      let usersQuery = supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (startDate) {
        usersQuery = usersQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        usersQuery = usersQuery.lte('created_at', endDate);
      }
      
      const { data: recentUsers, error: usersError } = await usersQuery;
      
      if (usersError) {
        return { data: null, error: usersError.message };
      }
      
      // Get recent polls
      let pollsQuery = supabase
        .from('polls')
        .select('id, title, total_votes, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (startDate) {
        pollsQuery = pollsQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        pollsQuery = pollsQuery.lte('created_at', endDate);
      }
      
      const { data: recentPolls, error: pollsError } = await pollsQuery;
      
      if (pollsError) {
        return { data: null, error: pollsError.message };
      }
      
      // Get recent moderator actions
      let actionsQuery = supabase
        .from('moderator_actions')
        .select('id, action_type, target_id, target_table, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (startDate) {
        actionsQuery = actionsQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        actionsQuery = actionsQuery.lte('created_at', endDate);
      }
      
      const { data: recentActions, error: actionsError } = await actionsQuery;
      
      if (actionsError) {
        return { data: null, error: actionsError.message };
      }
      
      // Combine and sort all activities
      const allActivities = [
        ...(recentUsers || []).map(user => ({
          type: 'user' as const,
          message: `New user registration: ${user.email}`,
          time: this.getTimeAgo(new Date(user.created_at)),
          timestamp: new Date(user.created_at)
        })),
        ...(recentPolls || []).map(poll => ({
          type: 'poll' as const,
          message: `New poll created: "${poll.title}"`,
          time: this.getTimeAgo(new Date(poll.created_at)),
          timestamp: new Date(poll.created_at)
        })),
        ...(recentActions || []).map(action => ({
          type: 'moderation' as const,
          message: `${this.formatActionType(action.action_type)} on ${action.target_table} #${action.target_id.substring(0, 8)}`,
          time: this.getTimeAgo(new Date(action.created_at)),
          timestamp: new Date(action.created_at)
        }))
      ];
      
      // Sort by timestamp (most recent first) and limit
      const sortedActivities = allActivities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      
      return { data: sortedActivities, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get recent activity'
      };
    }
  }

  /**
   * Get top countries by user count with date filtering
   */
  static async getTopCountries(
    limit: number = 5,
    options: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ServiceResponse<Array<{
    country: string;
    count: number;
    percentage: number;
  }>>> {
    try {
      const { startDate, endDate } = options;
      
      // Use the RPC function to get user counts by country
      const { data, error } = await supabase
        .rpc('get_user_counts_by_country');
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Get total users for percentage calculation
      let usersQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (startDate) {
        usersQuery = usersQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        usersQuery = usersQuery.lte('created_at', endDate);
      }
      
      const { count: totalUsers } = await usersQuery;
      
      // Calculate percentages and limit results
      const topCountries = (data || [])
        .slice(0, limit)
        .map(item => ({
          country: item.country,
          count: Number(item.user_count),
          percentage: totalUsers ? (Number(item.user_count) / totalUsers) * 100 : 0
        }));
      
      return { data: topCountries, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get top countries'
      };
    }
  }

  /**
   * Get user growth data for chart with date filtering
   */
  static async getUserGrowthData(
    days: number = 7,
    options: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ServiceResponse<Array<{
    date: string;
    count: number;
  }>>> {
    try {
      const { startDate, endDate } = options;
      
      // If specific date range is provided, use it
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        // Limit to reasonable number of data points
        const maxDays = Math.min(daysDiff + 1, 30);
        const result = [];
        
        for (let i = 0; i < maxDays; i++) {
          const currentDate = new Date(start);
          currentDate.setDate(currentDate.getDate() + i);
          
          if (currentDate > end) break;
          
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentDate.toISOString())
            .lt('created_at', nextDate.toISOString());
          
          result.push({
            date: currentDate.toISOString().split('T')[0],
            count: count || 0
          });
        }
        
        return { data: result, error: null };
      } else {
        // Default behavior - last N days
        const result = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        
        // Loop through each day and get the count
        for (let i = 0; i < days; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i);
          
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentDate.toISOString())
            .lt('created_at', nextDate.toISOString());
          
          result.push({
            date: currentDate.toISOString().split('T')[0],
            count: count || 0
          });
        }
        
        return { data: result, error: null };
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user growth data'
      };
    }
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth(): Promise<ServiceResponse<{
    serverStatus: 'operational' | 'degraded' | 'down';
    databaseStatus: 'healthy' | 'issues' | 'down';
    apiResponseTime: number;
    uptime: number;
  }>> {
    try {
      // This would typically call backend health check endpoints
      // For now, we'll simulate with some reasonable values
      
      // Check database connection
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      const apiResponseTime = Date.now() - startTime;
      
      const databaseStatus = error ? 'issues' : 'healthy';
      const serverStatus = error ? 'degraded' : 'operational';
      
      return {
        data: {
          serverStatus,
          databaseStatus,
          apiResponseTime,
          uptime: 99.9 // Simulated uptime percentage
        },
        error: null
      };
    } catch (error) {
      return {
        data: {
          serverStatus: 'down',
          databaseStatus: 'down',
          apiResponseTime: 0,
          uptime: 0
        },
        error: error instanceof Error ? error.message : 'Failed to get system health'
      };
    }
  }

  /**
   * Get poll analytics data with date filtering
   */
  static async getPollAnalytics(options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ServiceResponse<{
    totalPolls: number;
    activePolls: number;
    pollsByCategory: { category: string; count: number }[];
    votesByDay: { date: string; count: number }[];
  }>> {
    try {
      const { startDate, endDate } = options;
      
      // Get total polls
      let pollsQuery = supabase
        .from('polls')
        .select('*', { count: 'exact', head: true });
      
      if (startDate) {
        pollsQuery = pollsQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        pollsQuery = pollsQuery.lte('created_at', endDate);
      }
      
      const { count: totalPolls, error: pollsError } = await pollsQuery;
      
      if (pollsError) {
        return { data: null, error: pollsError.message };
      }
      
      // Get active polls
      let activePollsQuery = supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (startDate) {
        activePollsQuery = activePollsQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        activePollsQuery = activePollsQuery.lte('created_at', endDate);
      }
      
      const { count: activePolls, error: activePollsError } = await activePollsQuery;
      
      if (activePollsError) {
        return { data: null, error: activePollsError.message };
      }
      
      // Get polls by category
      let categoryQuery = supabase
        .from('polls')
        .select('category');
      
      if (startDate) {
        categoryQuery = categoryQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        categoryQuery = categoryQuery.lte('created_at', endDate);
      }
      
      const { data: categoryData, error: categoryError } = await categoryQuery;
      
      if (categoryError) {
        return { data: null, error: categoryError.message };
      }
      
      // Count polls by category
      const categoryCounts: Record<string, number> = {};
      (categoryData || []).forEach(poll => {
        const category = poll.category || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      const pollsByCategory = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
      
      // Get votes by day
      let votesQuery = supabase
        .from('poll_votes')
        .select('created_at');
      
      if (startDate) {
        votesQuery = votesQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        votesQuery = votesQuery.lte('created_at', endDate);
      }
      
      const { data: votesData, error: votesError } = await votesQuery;
      
      if (votesError) {
        return { data: null, error: votesError.message };
      }
      
      // Group votes by day
      const votesByDayMap = new Map<string, number>();
      (votesData || []).forEach(vote => {
        const date = new Date(vote.created_at).toISOString().split('T')[0];
        votesByDayMap.set(date, (votesByDayMap.get(date) || 0) + 1);
      });
      
      // Convert to array and sort by date
      const votesByDay = Array.from(votesByDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        data: {
          totalPolls: totalPolls || 0,
          activePolls: activePolls || 0,
          pollsByCategory,
          votesByDay
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get poll analytics'
      };
    }
  }

  /**
   * Get trivia analytics data with date filtering
   */
  static async getTriviaAnalytics(options: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ServiceResponse<{
    totalGames: number;
    totalQuestions: number;
    completionsByDifficulty: { difficulty: string; count: number }[];
    averageScores: { difficulty: string; score: number }[];
  }>> {
    try {
      const { startDate, endDate } = options;
      
      // Get total games
      let gamesQuery = supabase
        .from('trivia_games')
        .select('*', { count: 'exact', head: true });
      
      if (startDate) {
        gamesQuery = gamesQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        gamesQuery = gamesQuery.lte('created_at', endDate);
      }
      
      const { count: totalGames, error: gamesError } = await gamesQuery;
      
      if (gamesError) {
        return { data: null, error: gamesError.message };
      }
      
      // Get total questions
      let questionsQuery = supabase
        .from('trivia_questions')
        .select('*', { count: 'exact', head: true });
      
      if (startDate) {
        questionsQuery = questionsQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        questionsQuery = questionsQuery.lte('created_at', endDate);
      }
      
      const { count: totalQuestions, error: questionsError } = await questionsQuery;
      
      if (questionsError) {
        return { data: null, error: questionsError.message };
      }
      
      // Get completions by difficulty
      let historyQuery = supabase
        .from('daily_reward_history')
        .select('reward_data')
        .eq('reward_type', 'trivia');
      
      if (startDate) {
        historyQuery = historyQuery.gte('created_at', startDate);
      }
      
      if (endDate) {
        historyQuery = historyQuery.lte('created_at', endDate);
      }
      
      const { data: historyData, error: historyError } = await historyQuery;
      
      if (historyError) {
        return { data: null, error: historyError.message };
      }
      
      // Count completions by difficulty
      const difficultyCompletions: Record<string, number> = {
        easy: 0,
        medium: 0,
        hard: 0
      };
      
      // Track scores by difficulty
      const difficultyScores: Record<string, number[]> = {
        easy: [],
        medium: [],
        hard: []
      };
      
      (historyData || []).forEach(history => {
        const difficulty = history.reward_data?.difficulty;
        const score = history.reward_data?.score;
        
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
          difficultyCompletions[difficulty] = (difficultyCompletions[difficulty] || 0) + 1;
          
          if (score !== undefined) {
            if (!difficultyScores[difficulty]) {
              difficultyScores[difficulty] = [];
            }
            difficultyScores[difficulty].push(score);
          }
        }
      });
      
      // Format completions by difficulty
      const completionsByDifficulty = Object.entries(difficultyCompletions)
        .map(([difficulty, count]) => ({ difficulty, count }))
        .sort((a, b) => {
          const order = { easy: 1, medium: 2, hard: 3 };
          return order[a.difficulty as keyof typeof order] - order[b.difficulty as keyof typeof order];
        });
      
      // Calculate average scores
      const averageScores = Object.entries(difficultyScores)
        .map(([difficulty, scores]) => {
          const average = scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : 0;
          return { difficulty, score: average };
        })
        .sort((a, b) => {
          const order = { easy: 1, medium: 2, hard: 3 };
          return order[a.difficulty as keyof typeof order] - order[b.difficulty as keyof typeof order];
        });
      
      return {
        data: {
          totalGames: totalGames || 0,
          totalQuestions: totalQuestions || 0,
          completionsByDifficulty,
          averageScores
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia analytics'
      };
    }
  }

  /**
   * Helper method to format time ago
   */
  private static getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
  }

  /**
   * Helper method to format action type
   */
  private static formatActionType(actionType: string): string {
    // Convert snake_case or camelCase to Title Case with spaces
    return actionType
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\w/, c => c.toUpperCase());
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getPlatformStats,
  getRecentActivity,
  getTopCountries,
  getUserGrowthData,
  getSystemHealth,
  getPollAnalytics,
  getTriviaAnalytics
} = AdminService;