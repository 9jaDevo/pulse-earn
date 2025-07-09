import { supabase, Database } from '../lib/supabase';
import { PayoutService } from './payoutService';
import type { ServiceResponse } from './profileService';
import type { AmbassadorDetails, CountryMetric, AmbassadorStats, CommissionTier } from '../types/api';

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

      // Get ambassador tier information
      const { data: tierInfo, error: tierError } = await supabase
        .rpc('get_ambassador_tier', { p_ambassador_id: userId });
      
      if (tierError) {
        console.error('Error getting ambassador tier:', tierError);
        // Continue with basic stats even if tier info fails
      }

      // Get current month metrics with proper date calculation
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based month
      
      // Calculate first day of current month
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const firstDayString = firstDayOfMonth.toISOString().split('T')[0];
      
      // Calculate first day of next month (to use as upper bound)
      const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
      const firstDayOfNextMonthString = firstDayOfNextMonth.toISOString().split('T')[0];

      const { data: monthlyMetrics } = await supabase
        .from('country_metrics')
        .select('ad_revenue')
        .eq('country', ambassador.country)
        .gte('metric_date', firstDayString)
        .lt('metric_date', firstDayOfNextMonthString);

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
      
      // Get payable balance
      const { data: payableBalance } = await PayoutService.getPayableBalance(userId);

      // Prepare stats object
      const stats: AmbassadorStats = {
        totalReferrals: ambassador.total_referrals,
        totalEarnings: ambassador.total_earnings,
        monthlyEarnings,
        conversionRate,
        countryRank: countryRank || 1,
        payableBalance: payableBalance || 0
      };

      // Add tier information if available
      if (tierInfo && tierInfo.found) {
        stats.tierName = tierInfo.tier_name;
        stats.nextTierName = tierInfo.next_tier_name;
        stats.referralsToNextTier = tierInfo.referrals_to_next_tier;
      }

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
      offset?: number;
      country?: string;
      isActive?: boolean;
      orderBy?: 'total_earnings' | 'total_referrals' | 'created_at';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ServiceResponse<{
    ambassadors: AmbassadorDetails[];
    totalCount: number;
  }>> {
    try {
      const { 
        limit = 50, 
        offset = 0,
        country, 
        isActive, 
        orderBy = 'total_earnings', 
        order = 'desc' 
      } = options;

      let query = supabase
        .from('ambassadors')
        .select('*', { count: 'exact' })
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (country) {
        query = query.eq('country', country);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { 
        data: { 
          ambassadors: data || [], 
          totalCount: count || 0 
        }, 
        error: null 
      };
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
   * Process ad revenue commission
   */
  static async processAdRevenueCommission(
    referrerId: string,
    amount: number,
    country?: string
  ): Promise<ServiceResponse<{
    commissionAmount: number;
    commissionRate: number;
  }>> {
    try {
      // Call the process_referral_commission function
      const { data, error } = await supabase
        .rpc('process_referral_commission', {
          p_referrer_id: referrerId,
          p_referred_id: null, // Not needed for ad revenue
          p_amount: amount,
          p_country: country
        });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Get the commission rate used
      const { data: rateData } = await supabase
        .rpc('calculate_ambassador_commission', {
          p_ambassador_id: referrerId,
          p_country: country
        });
      
      return { 
        data: {
          commissionAmount: data,
          commissionRate: rateData || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to process commission'
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
    payoutHistory: any[];
  }>> {
    try {
      // Get all data in parallel
      const [
        ambassadorResult,
        statsResult,
        tierInfoResult,
        topCountriesResult,
        payoutResult
      ] = await Promise.all([
        this.getAmbassadorDetails(userId),
        this.getAmbassadorStats(userId),
        supabase.rpc('get_ambassador_tier', { p_ambassador_id: userId }),
        this.getTopCountries('ad_revenue', 5),
        PayoutService.getUserPayoutRequests(userId, { limit: 5 })
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
      
      // Enhance stats with tier information if available
      let enhancedStats = statsResult.data || {
        totalReferrals: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
        conversionRate: 0,
        countryRank: 1
      };
      
      if (tierInfoResult.data && tierInfoResult.data.found) {
        enhancedStats = {
          ...enhancedStats,
          tierName: tierInfoResult.data.tier_name,
          nextTierName: tierInfoResult.data.next_tier_name,
          referralsToNextTier: tierInfoResult.data.referrals_to_next_tier
        };
      }

      return {
        data: {
          ambassador: ambassadorResult.data,
          stats: enhancedStats,
          recentMetrics: countryMetrics || [],
          topCountries: topCountriesResult.data || [],
          payoutHistory: payoutResult.data?.requests || []
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
  
  /**
   * Get commission tiers
   */
  static async getCommissionTiers(
    options: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    tiers: CommissionTier[];
    totalCount: number;
  }>> {
    try {
      const { limit = 50, offset = 0, isActive } = options;
      
      let query = supabase
        .from('ambassador_commission_tiers')
        .select('*', { count: 'exact' })
        .order('min_referrals', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          tiers: data || [],
          totalCount: count || 0
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get commission tiers'
      };
    }
  }
  
  /**
   * Create commission tier
   */
  static async createCommissionTier(
    adminId: string,
    tierData: {
      name: string;
      min_referrals: number;
      global_rate: number;
      country_rates?: Record<string, number>;
    }
  ): Promise<ServiceResponse<CommissionTier>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .single();
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can manage commission tiers' };
      }
      
      const { data, error } = await supabase
        .from('ambassador_commission_tiers')
        .insert({
          name: tierData.name,
          min_referrals: tierData.min_referrals,
          global_rate: tierData.global_rate,
          country_rates: tierData.country_rates || {}
        })
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create commission tier'
      };
    }
  }
  
  /**
   * Update commission tier
   */
  static async updateCommissionTier(
    adminId: string,
    tierId: string,
    updates: {
      name?: string;
      min_referrals?: number;
      global_rate?: number;
      country_rates?: Record<string, number>;
      is_active?: boolean;
    }
  ): Promise<ServiceResponse<CommissionTier>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .single();
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can manage commission tiers' };
      }
      
      const { data, error } = await supabase
        .from('ambassador_commission_tiers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tierId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update commission tier'
      };
    }
  }
  
  /**
   * Delete commission tier
   */
  static async deleteCommissionTier(
    adminId: string,
    tierId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminId)
        .single();
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can manage commission tiers' };
      }
      
      const { error } = await supabase
        .from('ambassador_commission_tiers')
        .delete()
        .eq('id', tierId);
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete commission tier'
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
  getAmbassadorDashboard,
  processAdRevenueCommission,
  getCommissionTiers,
  createCommissionTier,
  updateCommissionTier,
  deleteCommissionTier
} = AmbassadorService;