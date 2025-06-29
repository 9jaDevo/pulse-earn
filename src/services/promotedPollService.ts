import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import { SettingsService } from './settingsService';
import { PollService } from './pollService';
import type { ServiceResponse } from './profileService';
import type { 
  PromotedPoll, 
  PromotedPollCreateRequest, 
  PromotedPollUpdateRequest,
  Poll
} from '../types/api';

/**
 * Promoted Poll Service
 * 
 * This service handles all promoted poll operations including:
 * - Creating and managing promoted polls
 * - Handling approval workflow
 * - Tracking votes and budget
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class PromotedPollService {
  /**
   * Get promoted poll by ID
   */
  static async getPromotedPollById(
    promotedPollId: string,
    includeDetails: boolean = false
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      let query = supabase
        .from('promoted_polls')
        .select(includeDetails ? `
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*)
        ` : '*')
        .eq('id', promotedPollId)
        .maybeSingle();
      
      const { data, error } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data) {
        return { data: null, error: 'Promoted poll not found' };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get promoted poll'
      };
    }
  }
  
  /**
   * Get promoted polls for a user
   */
  static async getUserPromotedPolls(
    userId: string,
    options: {
      status?: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
      limit?: number;
      offset?: number;
      includeDetails?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    promotedPolls: PromotedPoll[];
    totalCount: number;
  }>> {
    try {
      const { status, limit = 50, offset = 0, includeDetails = false } = options;
      
      // First get the user's sponsors
      const { data: sponsors, error: sponsorsError } = await supabase
        .from('sponsors')
        .select('id')
        .eq('user_id', userId);
      
      if (sponsorsError) {
        return { data: null, error: sponsorsError.message };
      }
      
      if (!sponsors || sponsors.length === 0) {
        return { 
          data: {
            promotedPolls: [],
            totalCount: 0
          }, 
          error: null 
        };
      }
      
      const sponsorIds = sponsors.map(s => s.id);
      
      let query = supabase
        .from('promoted_polls')
        .select(
          includeDetails 
            ? `*, poll:poll_id(*), sponsor:sponsor_id(*)` 
            : '*',
          { count: 'exact' }
        )
        .in('sponsor_id', sponsorIds)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { 
        data: {
          promotedPolls: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user promoted polls'
      };
    }
  }
  
  /**
   * Get all promoted polls (admin only)
   */
  static async getAllPromotedPolls(
    adminId: string,
    options: {
      status?: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
      payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
      limit?: number;
      offset?: number;
      includeDetails?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    promotedPolls: PromotedPoll[];
    totalCount: number;
  }>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can view all promoted polls' };
      }
      
      const { 
        status, 
        payment_status, 
        limit = 50, 
        offset = 0,
        includeDetails = false
      } = options;
      
      let query = supabase
        .from('promoted_polls')
        .select(
          includeDetails 
            ? `*, poll:poll_id(*), sponsor:sponsor_id(*)` 
            : '*',
          { count: 'exact' }
        )
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (payment_status) {
        query = query.eq('payment_status', payment_status);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { 
        data: {
          promotedPolls: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get all promoted polls'
      };
    }
  }
  
  /**
   * Create a promoted poll request
   */
  static async createPromotedPoll(
    userId: string,
    promotedPollData: PromotedPollCreateRequest
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // Check if user owns the sponsor
      const { data: sponsor, error: sponsorError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', promotedPollData.sponsor_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (sponsorError) {
        return { data: null, error: sponsorError.message };
      }
      
      if (!sponsor) {
        return { data: null, error: 'Unauthorized: You do not own this sponsor' };
      }
      
      // Check if poll exists and is active
      const { data: poll, error: pollError } = await PollService.fetchPollById(promotedPollData.poll_id);
      
      if (pollError || !poll) {
        return { data: null, error: 'Poll not found or inactive' };
      }
      
      // Check if poll is already being promoted
      const { count: existingCount, error: existingError } = await supabase
        .from('promoted_polls')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', poll.id)
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'rejected');
      
      if (existingError) {
        return { data: null, error: existingError.message };
      }
      
      if (existingCount && existingCount > 0) {
        return { data: null, error: 'This poll is already being promoted' };
      }
      
      // Get promotion settings
      const { data: settings } = await SettingsService.getSettings('promoted_polls');
      
      const defaultCostPerVote = settings?.default_cost_per_vote || 0.05;
      const minimumBudget = settings?.minimum_budget || 10.00;
      const maximumBudget = settings?.maximum_budget || 1000.00;
      
      // Validate budget amount
      if (promotedPollData.budget_amount < minimumBudget) {
        return { data: null, error: `Minimum budget is $${minimumBudget.toFixed(2)}` };
      }
      
      if (promotedPollData.budget_amount > maximumBudget) {
        return { data: null, error: `Maximum budget is $${maximumBudget.toFixed(2)}` };
      }
      
      // Calculate target votes if not provided
      const targetVotes = promotedPollData.target_votes || Math.floor(promotedPollData.budget_amount / defaultCostPerVote);
      
      // Calculate cost per vote
      const costPerVote = promotedPollData.budget_amount / targetVotes;
      
      // Create the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .insert({
          poll_id: poll.id,
          sponsor_id: promotedPollData.sponsor_id,
          pricing_model: 'CPV',
          budget_amount: promotedPollData.budget_amount,
          cost_per_vote: costPerVote,
          target_votes: targetVotes,
          current_votes: 0,
          status: 'pending_approval',
          payment_status: 'pending',
          start_date: promotedPollData.start_date,
          end_date: promotedPollData.end_date
        })
        .select()
        .maybeSingle();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data) {
        return { data: null, error: 'Failed to create promoted poll' };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create promoted poll'
      };
    }
  }
  
  /**
   * Update a promoted poll
   */
  static async updatePromotedPoll(
    userId: string,
    promotedPollId: string,
    updates: PromotedPollUpdateRequest
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // First, get the current promoted poll to check its payment status
      const { data: currentPoll, error: fetchError } = await this.getPromotedPollById(promotedPollId);
      
      if (fetchError || !currentPoll) {
        return { data: null, error: fetchError || 'Promoted poll not found' };
      }
      
      // Check if user is admin or owns the sponsor
      const { data: profile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = profile?.role === 'admin';
      
      if (!isAdmin) {
        // Get the promoted poll to check ownership
        const { data: promotedPoll } = await supabase
          .from('promoted_polls')
          .select('sponsor_id')
          .eq('id', promotedPollId)
          .maybeSingle();
        
        if (!promotedPoll) {
          return { data: null, error: 'Promoted poll not found' };
        }
        
        // Check if user owns the sponsor
        const { count } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact', head: true })
          .eq('id', promotedPoll.sponsor_id)
          .eq('user_id', userId);
        
        if (!count || count === 0) {
          return { data: null, error: 'Unauthorized: You do not own this promoted poll' };
        }
      }
      
      // If the poll has been paid for, prevent updates to financial fields
      if (currentPoll.payment_status === 'paid') {
        // Remove financial fields from updates
        const { budget_amount, target_votes, start_date, end_date, ...allowedUpdates } = updates;
        
        // If there are no allowed updates left, return an error
        if (Object.keys(allowedUpdates).length === 0) {
          return { 
            data: null, 
            error: 'Cannot update budget, target votes, or dates after payment has been processed. Please contact support for assistance.' 
          };
        }
        
        // Only proceed with the allowed updates
        updates = allowedUpdates;
      }
      
      // If status is being updated to 'active', set approved_by and approved_at
      if (isAdmin && updates.status === 'active') {
        updates = {
          ...updates,
          approved_by: userId,
          approved_at: new Date().toISOString()
        } as any;
      }
      
      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select()
        .maybeSingle();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data) {
        return { data: null, error: 'Promoted poll not found or could not be updated' };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update promoted poll'
      };
    }
  }
  
  /**
   * Approve or reject a promoted poll (admin only)
   */
  static async updatePromotedPollStatus(
    adminId: string,
    promotedPollId: string,
    status: 'active' | 'rejected',
    adminNotes?: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can approve or reject promoted polls' };
      }
      
      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          status,
          admin_notes: adminNotes,
          approved_by: status === 'active' ? adminId : null,
          approved_at: status === 'active' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select()
        .maybeSingle();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data) {
        return { data: null, error: 'Promoted poll not found or could not be updated' };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update promoted poll status'
      };
    }
  }
  
  /**
   * Increment promoted poll votes
   * This is called when a vote is cast on a promoted poll
   */
  static async incrementPromotedPollVotes(
    promotedPollId: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // This function is mostly for completeness - the database trigger handles this automatically
      // But we can use it to get the updated promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .select('*')
        .eq('id', promotedPollId)
        .maybeSingle();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      if (!data) {
        return { data: null, error: 'Promoted poll not found' };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to increment promoted poll votes'
      };
    }
  }
  
  /**
   * Get active promoted polls
   * This is used to display promoted polls to users
   */
  static async getActivePromotedPolls(
    options: {
      limit?: number;
      offset?: number;
      country?: string;
      includeDetails?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    promotedPolls: PromotedPoll[];
    totalCount: number;
  }>> {
    try {
      const { limit = 10, offset = 0, country, includeDetails = true } = options;
      
      let query = supabase
        .from('promoted_polls')
        .select(
          includeDetails 
            ? `*, poll:poll_id(*), sponsor:sponsor_id(*)` 
            : '*',
          { count: 'exact' }
        )
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      // If country is specified, filter polls by country
      if (country) {
        query = query.or(`poll.country.is.null,poll.country.eq.${country}`);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { 
        data: {
          promotedPolls: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get active promoted polls'
      };
    }
  }
  
  /**
   * Check if a poll is being promoted
   */
  static async isPollPromoted(pollId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { count, error } = await supabase
        .from('promoted_polls')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId)
        .eq('status', 'active')
        .eq('payment_status', 'paid');
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: count !== null && count > 0, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check if poll is promoted'
      };
    }
  }
  
  /**
   * Get promoted poll settings
   */
  static async getPromotedPollSettings(): Promise<ServiceResponse<{
    is_enabled: boolean;
    default_cost_per_vote: number;
    minimum_budget: number;
    maximum_budget: number;
    approval_required: boolean;
    points_to_usd_conversion: number;
    available_payment_methods: string[];
  }>> {
    try {
      const { data, error } = await SettingsService.getSettings('promoted_polls');
      
      if (error) {
        return { data: null, error };
      }
      
      // Set default values if settings are missing
      const settings = {
        is_enabled: data?.is_enabled !== false,
        default_cost_per_vote: data?.default_cost_per_vote || 0.05,
        minimum_budget: data?.minimum_budget || 10.00,
        maximum_budget: data?.maximum_budget || 1000.00,
        approval_required: data?.approval_required !== false,
        points_to_usd_conversion: data?.points_to_usd_conversion || 100,
        available_payment_methods: data?.available_payment_methods || ['wallet', 'stripe', 'paypal', 'paystack']
      };
      
      return { data: settings, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get promoted poll settings'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getPromotedPollById,
  getUserPromotedPolls,
  getAllPromotedPolls,
  createPromotedPoll,
  updatePromotedPoll,
  updatePromotedPollStatus,
  incrementPromotedPollVotes,
  getActivePromotedPolls,
  isPollPromoted,
  getPromotedPollSettings
} = PromotedPollService;