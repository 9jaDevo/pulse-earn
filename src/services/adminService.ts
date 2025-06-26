import { supabase } from '../lib/supabase';
import type { ServiceResponse } from './profileService';

/**
 * Admin Service
 *
 * This service handles fetching various statistics and data points
 * specifically for the admin dashboard.
 */
export class AdminService {
  /**
   * Fetches overall platform statistics using a Supabase RPC function.
   */
  static async getPlatformStats(): Promise<ServiceResponse<{
    total_users: number;
    active_polls: number;
    total_points_distributed: number;
    total_votes: number;
    new_users_today: number;
    polls_created_today: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_platform_stats');

      if (error) {
        return { data: null, error: error.message };
      }

      // The RPC function returns an array, we expect a single object
      return { data: data ? data[0] : null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get platform stats'
      };
    }
  }

  /**
   * Fetches revenue statistics from country_metrics table.
   * Calculates total revenue and monthly change.
   */
  static async getRevenueStats(): Promise<ServiceResponse<{
    totalRevenue: number;
    monthlyChange: number;
  }>> {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(today.getDate() - 60);

      // Fetch data for the last 30 days
      const { data: currentMonthData, error: currentMonthError } = await supabase
        .from('country_metrics')
        .select('ad_revenue')
        .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('metric_date', today.toISOString().split('T')[0]);

      if (currentMonthError) {
        return { data: null, error: currentMonthError.message };
      }

      const totalRevenue = (currentMonthData || []).reduce((sum, metric) => sum + metric.ad_revenue, 0);

      // Fetch data for the previous 30 days to calculate change
      const { data: previousMonthData, error: previousMonthError } = await supabase
        .from('country_metrics')
        .select('ad_revenue')
        .gte('metric_date', sixtyDaysAgo.toISOString().split('T')[0])
        .lt('metric_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (previousMonthError) {
        return { data: null, error: previousMonthError.message };
      }

      const previousMonthRevenue = (previousMonthData || []).reduce((sum, metric) => sum + metric.ad_revenue, 0);

      const monthlyChange = previousMonthRevenue > 0 
        ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      return {
        data: {
          totalRevenue,
          monthlyChange
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get revenue stats'
      };
    }
  }

  /**
   * Fetches recent activity for the admin dashboard
   */
  static async getRecentActivity(limit: number = 5): Promise<ServiceResponse<Array<{
    type: string;
    message: string;
    time: string;
    timestamp: Date;
  }>>> {
    try {
      // Get recent user registrations
      const { data: newUsers, error: usersError } = await supabase
        .from('profiles')
        .select('email, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (usersError) {
        return { data: null, error: usersError.message };
      }

      // Get recent polls
      const { data: newPolls, error: pollsError } = await supabase
        .from('polls')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (pollsError) {
        return { data: null, error: pollsError.message };
      }

      // Get recent moderator actions
      const { data: modActions, error: modError } = await supabase
        .from('moderator_actions')
        .select('action_type, target_table, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (modError) {
        return { data: null, error: modError.message };
      }

      // Combine and sort all activities
      const activities: Array<{
        type: string;
        message: string;
        time: string;
        timestamp: Date;
      }> = [
        ...(newUsers || []).map(user => ({
          type: 'user',
          message: `New user registration: ${user.email}`,
          time: this.formatRelativeTime(new Date(user.created_at)),
          timestamp: new Date(user.created_at)
        })),
        ...(newPolls || []).map(poll => ({
          type: 'poll',
          message: `New poll created: "${poll.title}"`,
          time: this.formatRelativeTime(new Date(poll.created_at)),
          timestamp: new Date(poll.created_at)
        })),
        ...(modActions || []).map(action => ({
          type: 'moderation',
          message: `${this.formatActionType(action.action_type)} on ${action.target_table}`,
          time: this.formatRelativeTime(new Date(action.created_at)),
          timestamp: new Date(action.created_at)
        }))
      ];

      // Sort by timestamp, most recent first
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Return only the most recent activities
      return { data: activities.slice(0, limit), error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get recent activity'
      };
    }
  }

  /**
   * Format action type to be more readable
   */
  private static formatActionType(actionType: string): string {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  private static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get user growth data for the chart
   */
  static async getUserGrowthData(days: number = 7): Promise<ServiceResponse<number[]>> {
    try {
      const result: number[] = [];
      const today = new Date();
      
      // For each of the last N days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Count users created on this date
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);
        
        if (error) {
          console.error(`Error fetching user count for ${dateStr}:`, error);
          result.push(0); // Push 0 on error
        } else {
          result.push(count || 0);
        }
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
   * Get top countries by user count
   */
  static async getTopCountries(limit: number = 5): Promise<ServiceResponse<Array<{
    country: string;
    userCount: number;
    percentage: number;
  }>>> {
    try {
      // Get total user count
      const { count: totalUsers, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        return { data: null, error: countError.message };
      }
      
      // Get count by country using RPC function
      const { data, error } = await supabase.rpc('get_user_counts_by_country');
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Calculate percentages and limit results
      const topCountries = (data || [])
        .slice(0, limit)
        .map(item => ({
          country: item.country,
          userCount: parseInt(item.user_count),
          percentage: totalUsers ? (parseInt(item.user_count) / totalUsers) * 100 : 0
        }));
      
      return { data: topCountries, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get top countries'
      };
    }
  }
}