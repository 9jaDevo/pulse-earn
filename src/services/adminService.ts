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
   * Get platform overview statistics
   */
  static async getPlatformStats(): Promise<ServiceResponse<{
    totalUsers: number;
    activeUsers: number;
    totalPolls: number;
    totalVotes: number;
    totalPoints: number;
    recentSignups: number;
  }>> {
    try {
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
      
      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentSignups, error: signupsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
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
   * Get recent activity for admin dashboard
   */
  static async getRecentActivity(limit: number = 10): Promise<ServiceResponse<Array<{
    type: 'user' | 'poll' | 'moderation' | 'system';
    message: string;
    time: string;
    timestamp: Date;
  }>>> {
    try {
      // Get recent user registrations
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (usersError) {
        return { data: null, error: usersError.message };
      }
      
      // Get recent polls
      const { data: recentPolls, error: pollsError } = await supabase
        .from('polls')
        .select('id, title, total_votes, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (pollsError) {
        return { data: null, error: pollsError.message };
      }
      
      // Get recent moderator actions
      const { data: recentActions, error: actionsError } = await supabase
        .from('moderator_actions')
        .select('id, action_type, target_id, target_table, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
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
   * Get top countries by user count
   */
  static async getTopCountries(limit: number = 5): Promise<ServiceResponse<Array<{
    country: string;
    count: number;
    percentage: number;
  }>>> {
    try {
      // Use the RPC function to get user counts by country
      const { data, error } = await supabase
        .rpc('get_user_counts_by_country');
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Get total users for percentage calculation
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
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
   * Get user growth data for chart
   */
  static async getUserGrowthData(days: number = 7): Promise<ServiceResponse<Array<{
    date: string;
    count: number;
  }>>> {
    try {
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
  getSystemHealth
} = AdminService;