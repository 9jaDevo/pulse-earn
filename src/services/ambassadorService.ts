import { supabase, Database } from '../lib/supabase';
import type { ServiceResponse } from './profileService';
import type { AmbassadorDetails, CountryMetric, AmbassadorStats } from '../types/api';

type AmbassadorRow = Database['public']['Tables']['ambassadors']['Row'];
type CountryMetricRow = Database['public']['Tables']['country_metrics']['Row'];

/**
 * Ambassador Service
 * 
 * This service handles all ambassador-related operations including:
 * - Ambassador profile management
 * - Country metrics and statistics
 * - Commission tracking and payouts
 * - Referral management
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class AmbassadorService {
  /**
   * Get ambassador details by user ID
   */
  static async getAmbassadorDetails(userId: string): Promise<ServiceResponse<AmbassadorDetails>> {
    try {
      const { data, error } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get ambassador details'
      };
    }
  }

  /**
   * Get country metrics for ambassador's country
   */
  static async getCountryMetrics(
    country: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<ServiceResponse<CountryMetric[]>> {
    try {
      const { startDate, endDate, limit = 30 } = options;

      let query = supabase
        .from('country_metrics')
        .select('*')
        .eq('country', country)
        .order('metric_date', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('metric_date', startDate);
      }

      if (endDate) {
        query = query.lte('metric_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get country metrics'
      };
    }
  }

  /**
   * Get ambassador statistics
   */
  static async getAmbassadorStats(userId: string): Promise<ServiceResponse<AmbassadorStats>> {
    try {
      // Get ambassador details
      const { data: ambassador, error: ambassadorError } = await this.getAmbassadorDetails(userId);
      if (ambassadorError || !ambassador) {
        return { data: null, error: ambassadorError || 'Ambassador not found' };
      }

      // Get current month metrics
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { data: monthlyMetrics } = await supabase
        .from('country_metrics')
        .select('ad_revenue')
        .eq('country', ambassador.country)
        .gte('metric_date', `${currentMonth}-01`)
        .lte('metric_date', `${currentMonth}-31`);

      const monthlyRevenue = (monthlyMetrics || []).reduce((sum, metric) => sum + metric.ad_revenue, 0);
      const monthlyEarnings = monthlyRevenue * (ambassador.commission_rate / 100);

      // Calculate conversion rate (simplified)
      const conversionRate = ambassador.total_referrals > 0 ? 
        Math.min((ambassador.total_referrals / 100) * 100, 100) : 0;

      // Get country rank (simplified - would need proper ranking logic)
      const { data: allAmbassadors } = await supabase
        .from('ambassadors')
        .select('total_earnings')
        .eq('country', ambassador.country)
        .eq('is_active', true)
        .order('total_earnings', { ascending: false });

      const countryRank = (allAmbassadors || []).findIndex(a => a.total_earnings <= ambassador.total_earnings) + 1;

      const stats: AmbassadorStats = {
        totalReferrals: ambassador.total_referrals,
        totalEarnings: ambassador.total_earnings,
        monthlyEarnings,
        conversionRate,
        countryRank: countryRank || 1
      };

      return { data: stats, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get ambassador statistics'
      };
    }
  }

  /**
   * Update ambassador details
   */
  static async updateAmbassador(
    userId: string,
    updates: Partial<AmbassadorRow>
  ): Promise<ServiceResponse<AmbassadorDetails>> {
    try {
      const { data, error } = await supabase
        .from('ambassadors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update ambassador'
      };
    }
  }

  /**
   * Get all ambassadors (admin only)
   */
  static async getAllAmbassadors(
    options: {
      limit?: number;
      country?: string;
      isActive?: boolean;
      orderBy?: 'total_earnings' | 'total_referrals' | 'created_at';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ServiceResponse<AmbassadorDetails[]>> {
    try {
      const { 
        limit = 50, 
        country, 
        isActive, 
        orderBy = 'total_earnings', 
        order = 'desc' 
      } = options;

      let query = supabase
        .from('ambassadors')
        .select('*')
        .order(orderBy, { ascending: order === 'asc' })
        .limit(limit);

      if (country) {
        query = query.eq('country', country);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get ambassadors'
      };
    }
  }

  /**
   * Get top performing countries
   */
  static async getTopCountries(
    metric: 'ad_revenue' | 'user_count' | 'new_users' = 'ad_revenue',
    limit: number = 10
  ): Promise<ServiceResponse<{ country: string; value: number }[]>> {
    try {
      // Get latest metrics for each country
      const { data, error } = await supabase
        .from('country_metrics')
        .select(`country, ${metric}`)
        .eq('metric_date', new Date().toISOString().split('T')[0])
        .order(metric, { ascending: false })
        .limit(limit);

      if (error) {
        return { data: null, error: error.message };
      }

      const topCountries = (data || []).map(item => ({
        country: item.country,
        value: item[metric]
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
   * Record referral for ambassador
   */
  static async recordReferral(
    ambassadorUserId: string,
    referredUserId: string,
    commissionAmount: number
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Update ambassador stats
      const { error } = await supabase
        .from('ambassadors')
        .update({
          total_referrals: supabase.raw('total_referrals + 1'),
          total_earnings: supabase.raw(`total_earnings + ${commissionAmount}`),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', ambassadorUserId);

      if (error) {
        return { data: null, error: error.message };
      }

      // In a real implementation, you would also:
      // 1. Record the referral in a separate table
      // 2. Track the commission payment
      // 3. Update payout schedules

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record referral'
      };
    }
  }

  /**
   * Get ambassador dashboard data
   */
  static async getAmbassadorDashboard(userId: string): Promise<ServiceResponse<{
    ambassador: AmbassadorDetails;
    stats: AmbassadorStats;
    recentMetrics: CountryMetric[];
    topCountries: { country: string; value: number }[];
  }>> {
    try {
      // Get all data in parallel
      const [
        ambassadorResult,
        statsResult,
        metricsResult,
        topCountriesResult
      ] = await Promise.all([
        this.getAmbassadorDetails(userId),
        this.getAmbassadorStats(userId),
        this.getCountryMetrics('', { limit: 7 }), // Get recent metrics
        this.getTopCountries('ad_revenue', 5)
      ]);

      if (ambassadorResult.error) {
        return { data: null, error: ambassadorResult.error };
      }

      if (!ambassadorResult.data) {
        return { data: null, error: 'Ambassador not found' };
      }

      // Get metrics for ambassador's country
      const { data: countryMetrics } = await this.getCountryMetrics(
        ambassadorResult.data.country,
        { limit: 7 }
      );

      return {
        data: {
          ambassador: ambassadorResult.data,
          stats: statsResult.data || {
            totalReferrals: 0,
            totalEarnings: 0,
            monthlyEarnings: 0,
            conversionRate: 0,
            countryRank: 1
          },
          recentMetrics: countryMetrics || [],
          topCountries: topCountriesResult.data || []
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get ambassador dashboard'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getAmbassadorDetails,
  getCountryMetrics,
  getAmbassadorStats,
  updateAmbassador,
  getAllAmbassadors,
  getTopCountries,
  recordReferral,
  getAmbassadorDashboard
} = AmbassadorService;