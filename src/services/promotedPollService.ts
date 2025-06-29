import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';
import type { PromotedPoll, PromotedPollCreateRequest, PromotedPollUpdateRequest } from '../types/api';

/**
 * Promoted Poll Service
 * 
 * This service handles all operations related to promoted polls including:
 * - Creating and managing promoted polls
 * - Approval and rejection workflows
 * - Payment processing and tracking
 * - Performance analytics
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class PromotedPollService {
  /**
   * Get all promoted polls with optional filtering
   */
  static async getPromotedPolls(
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
      sponsorId?: string;
      orderBy?: 'created_at' | 'current_votes' | 'target_votes';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ServiceResponse<{
    promotedPolls: PromotedPoll[];
    totalCount: number;
  }>> {
    try {
      const { 
        limit = 10, 
        offset = 0, 
        status, 
        sponsorId, 
        orderBy = 'created_at', 
        order = 'desc' 
      } = options;

      let query = supabase
        .from('promoted_polls')
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*)
        `, { count: 'exact' })
        .order(orderBy, { ascending: order === 'asc' })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (sponsorId) {
        query = query.eq('sponsor_id', sponsorId);
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
        error: error instanceof Error ? error.message : 'Failed to get promoted polls'
      };
    }
  }

  /**
   * Get a promoted poll by ID
   */
  static async getPromotedPollById(id: string): Promise<ServiceResponse<PromotedPoll>> {
    try {
      const { data, error } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
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
   * Create a new promoted poll
   */
  static async createPromotedPoll(
    userId: string,
    promotedPollData: PromotedPollCreateRequest
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // Validate that the user owns the sponsor
      const { data: sponsor, error: sponsorError } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', promotedPollData.sponsor_id)
        .eq('user_id', userId)
        .single();

      if (sponsorError || !sponsor) {
        return { data: null, error: 'You do not have permission to create promoted polls for this sponsor' };
      }

      // Validate that the poll exists and is active
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', promotedPollData.poll_id)
        .eq('is_active', true)
        .single();

      if (pollError || !poll) {
        return { data: null, error: 'Poll not found or is inactive' };
      }

      // Check if poll is already promoted
      const { count: existingCount, error: existingError } = await supabase
        .from('promoted_polls')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', promotedPollData.poll_id);

      if (existingError) {
        return { data: null, error: existingError.message };
      }

      if (existingCount && existingCount > 0) {
        return { data: null, error: 'This poll is already being promoted' };
      }

      // Calculate cost based on target votes and cost per vote
      const totalCost = promotedPollData.target_votes * promotedPollData.cost_per_vote;

      // Validate budget against calculated cost
      if (promotedPollData.budget_amount < totalCost) {
        return { 
          data: null, 
          error: `Budget amount (${promotedPollData.budget_amount}) must be at least equal to target votes * cost per vote (${totalCost})` 
        };
      }

      // Create the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .insert({
          poll_id: promotedPollData.poll_id,
          sponsor_id: promotedPollData.sponsor_id,
          pricing_model: promotedPollData.pricing_model || 'CPV', // Cost Per Vote
          budget_amount: promotedPollData.budget_amount,
          cost_per_vote: promotedPollData.cost_per_vote,
          target_votes: promotedPollData.target_votes,
          current_votes: 0,
          status: 'pending_approval',
          payment_status: 'pending',
          start_date: promotedPollData.start_date,
          end_date: promotedPollData.end_date
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
      // First check if the user has permission to update this promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          sponsor:sponsor_id(user_id)
        `)
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if user is the sponsor owner or an admin
      const isOwner = promotedPoll.sponsor?.user_id === userId;
      
      // Check if user is admin
      const { data: userProfile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = userProfile?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return { data: null, error: 'You do not have permission to update this promoted poll' };
      }

      // Check if the poll is in a state that can be updated
      if (promotedPoll.status !== 'pending_approval' && promotedPoll.status !== 'paused' && !isAdmin) {
        return { data: null, error: 'This promoted poll cannot be updated in its current state' };
      }

      // If updating budget, validate it's not less than what's already spent
      if (updates.budget_amount !== undefined) {
        const spentAmount = promotedPoll.current_votes * promotedPoll.cost_per_vote;
        if (updates.budget_amount < spentAmount) {
          return { 
            data: null, 
            error: `Budget amount cannot be less than what's already spent (${spentAmount})` 
          };
        }
      }

      // If updating target votes, validate it's not less than current votes
      if (updates.target_votes !== undefined && updates.target_votes < promotedPoll.current_votes) {
        return { 
          data: null, 
          error: `Target votes cannot be less than current votes (${promotedPoll.current_votes})` 
        };
      }

      // If payment status is 'paid', don't allow budget or cost_per_vote changes
      if (promotedPoll.payment_status === 'paid' && 
          (updates.budget_amount !== undefined || updates.cost_per_vote !== undefined)) {
        return { 
          data: null, 
          error: 'Budget and cost per vote cannot be changed after payment has been processed' 
        };
      }

      // Prepare updates
      const updateData: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update(updateData)
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
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
   * Approve a promoted poll (admin only)
   */
  static async approvePromotedPoll(
    adminId: string,
    promotedPollId: string,
    notes?: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can approve promoted polls' };
      }

      // Get the promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select('*')
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if poll is in pending_approval status
      if (promotedPoll.status !== 'pending_approval') {
        return { data: null, error: 'Only pending polls can be approved' };
      }

      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          status: 'active',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to approve promoted poll'
      };
    }
  }

  /**
   * Reject a promoted poll (admin only)
   */
  static async rejectPromotedPoll(
    adminId: string,
    promotedPollId: string,
    reason: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can reject promoted polls' };
      }

      // Get the promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select('*')
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if poll is in pending_approval status
      if (promotedPoll.status !== 'pending_approval') {
        return { data: null, error: 'Only pending polls can be rejected' };
      }

      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          status: 'rejected',
          admin_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // If payment was made, initiate refund process
      if (promotedPoll.payment_status === 'paid') {
        // In a real implementation, you would call a payment service to process the refund
        // For now, we'll just update the payment status
        await supabase
          .from('promoted_polls')
          .update({
            payment_status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('id', promotedPollId);
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to reject promoted poll'
      };
    }
  }

  /**
   * Pause a promoted poll
   */
  static async pausePromotedPoll(
    userId: string,
    promotedPollId: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // First check if the user has permission to pause this promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          sponsor:sponsor_id(user_id)
        `)
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if user is the sponsor owner or an admin
      const isOwner = promotedPoll.sponsor?.user_id === userId;
      
      // Check if user is admin
      const { data: userProfile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = userProfile?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return { data: null, error: 'You do not have permission to pause this promoted poll' };
      }

      // Check if poll is in active status
      if (promotedPoll.status !== 'active') {
        return { data: null, error: 'Only active polls can be paused' };
      }

      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to pause promoted poll'
      };
    }
  }

  /**
   * Resume a paused promoted poll
   */
  static async resumePromotedPoll(
    userId: string,
    promotedPollId: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // First check if the user has permission to resume this promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          sponsor:sponsor_id(user_id)
        `)
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if user is the sponsor owner or an admin
      const isOwner = promotedPoll.sponsor?.user_id === userId;
      
      // Check if user is admin
      const { data: userProfile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = userProfile?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return { data: null, error: 'You do not have permission to resume this promoted poll' };
      }

      // Check if poll is in paused status
      if (promotedPoll.status !== 'paused') {
        return { data: null, error: 'Only paused polls can be resumed' };
      }

      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to resume promoted poll'
      };
    }
  }

  /**
   * Process payment for a promoted poll
   */
  static async processPayment(
    userId: string,
    promotedPollId: string,
    paymentDetails: {
      payment_method: string;
      payment_method_id?: string;
      stripe_payment_intent_id?: string;
      stripe_payment_method_id?: string;
      stripe_customer_id?: string;
    }
  ): Promise<ServiceResponse<{
    success: boolean;
    promotedPoll: PromotedPoll;
    transaction_id: string;
  }>> {
    try {
      // First check if the user has permission to pay for this promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          sponsor:sponsor_id(user_id)
        `)
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if user is the sponsor owner
      const isOwner = promotedPoll.sponsor?.user_id === userId;

      if (!isOwner) {
        return { data: null, error: 'You do not have permission to pay for this promoted poll' };
      }

      // Check if payment is already processed
      if (promotedPoll.payment_status === 'paid') {
        return { data: null, error: 'Payment has already been processed for this promoted poll' };
      }

      // In a real implementation, you would process the payment with a payment gateway
      // For now, we'll simulate a successful payment

      // Generate a transaction ID
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          promoted_poll_id: promotedPollId,
          amount: promotedPoll.budget_amount,
          currency: 'USD',
          payment_method: paymentDetails.payment_method,
          payment_method_id: paymentDetails.payment_method_id,
          gateway_transaction_id: transactionId,
          status: 'completed',
          stripe_payment_intent_id: paymentDetails.stripe_payment_intent_id,
          stripe_payment_method_id: paymentDetails.stripe_payment_method_id,
          stripe_customer_id: paymentDetails.stripe_customer_id
        });

      if (transactionError) {
        return { data: null, error: transactionError.message };
      }

      // Update the promoted poll payment status
      const { data, error } = await supabase
        .from('promoted_polls')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { 
        data: {
          success: true,
          promotedPoll: data,
          transaction_id: transactionId
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to process payment'
      };
    }
  }

  /**
   * Retry payment for a promoted poll with failed or pending payment status
   */
  static async retryPromotedPollPayment(
    userId: string,
    promotedPollId: string,
    paymentMethod: string
  ): Promise<ServiceResponse<{
    clientSecret?: string;
    authorizationUrl?: string;
    transactionId: string;
  }>> {
    try {
      // First check if the user has permission to retry payment for this promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          sponsor:sponsor_id(user_id)
        `)
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if user is the sponsor owner
      const isOwner = promotedPoll.sponsor?.user_id === userId;

      if (!isOwner) {
        return { data: null, error: 'You do not have permission to retry payment for this promoted poll' };
      }

      // Check if payment status is failed or pending
      if (promotedPoll.payment_status !== 'failed' && promotedPoll.payment_status !== 'pending') {
        return { data: null, error: 'Only failed or pending payments can be retried' };
      }

      // Create a new transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          promoted_poll_id: promotedPollId,
          amount: promotedPoll.budget_amount,
          currency: 'USD',
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (transactionError) {
        return { data: null, error: transactionError.message };
      }

      // Based on the payment method, initialize the appropriate payment gateway
      if (paymentMethod === 'stripe') {
        // Import the payment service dynamically to avoid circular dependencies
        const { PaymentService } = await import('./paymentService');
        
        const { data: stripeData, error: stripeError } = await PaymentService.initializeStripePayment(
          userId,
          promotedPoll.budget_amount,
          promotedPollId
        );
        
        if (stripeError) {
          return { data: null, error: stripeError };
        }
        
        return { 
          data: {
            clientSecret: stripeData?.clientSecret,
            transactionId: stripeData?.transactionId || transaction.id
          }, 
          error: null 
        };
      } else if (paymentMethod === 'paystack') {
        // Import the payment service dynamically to avoid circular dependencies
        const { PaymentService } = await import('./paymentService');
        
        const { data: paystackData, error: paystackError } = await PaymentService.initializePaystackPayment(
          userId,
          promotedPoll.budget_amount,
          promotedPollId
        );
        
        if (paystackError) {
          return { data: null, error: paystackError };
        }
        
        return { 
          data: {
            authorizationUrl: paystackData?.authorizationUrl,
            transactionId: transaction.id
          }, 
          error: null 
        };
      } else if (paymentMethod === 'wallet') {
        // Import the payment service dynamically to avoid circular dependencies
        const { PaymentService } = await import('./paymentService');
        
        const { data: walletData, error: walletError } = await PaymentService.processWalletPayment(
          userId,
          promotedPoll.budget_amount,
          promotedPollId
        );
        
        if (walletError) {
          return { data: null, error: walletError };
        }
        
        // Update the promoted poll payment status
        await supabase
          .from('promoted_polls')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', promotedPollId);
        
        return { 
          data: {
            transactionId: transaction.id
          }, 
          error: null 
        };
      } else {
        return { data: null, error: 'Unsupported payment method' };
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to retry payment'
      };
    }
  }

  /**
   * Get promoted poll analytics
   */
  static async getPromotedPollAnalytics(
    userId: string,
    promotedPollId: string
  ): Promise<ServiceResponse<{
    impressions: number;
    clicks: number;
    votes: number;
    ctr: number;
    conversionRate: number;
    costPerVote: number;
    spentBudget: number;
    remainingBudget: number;
    dailyStats: Array<{
      date: string;
      impressions: number;
      clicks: number;
      votes: number;
    }>;
  }>> {
    try {
      // First check if the user has permission to view analytics for this promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select(`
          *,
          sponsor:sponsor_id(user_id)
        `)
        .eq('id', promotedPollId)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found' };
      }

      // Check if user is the sponsor owner or an admin
      const isOwner = promotedPoll.sponsor?.user_id === userId;
      
      // Check if user is admin
      const { data: userProfile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = userProfile?.role === 'admin';

      if (!isOwner && !isAdmin) {
        return { data: null, error: 'You do not have permission to view analytics for this promoted poll' };
      }

      // In a real implementation, you would fetch actual analytics data
      // For now, we'll generate some sample data

      const impressions = promotedPoll.current_votes * 10 + Math.floor(Math.random() * 1000);
      const clicks = promotedPoll.current_votes * 2 + Math.floor(Math.random() * 200);
      const votes = promotedPoll.current_votes;
      
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (votes / clicks) * 100 : 0;
      
      const spentBudget = votes * promotedPoll.cost_per_vote;
      const remainingBudget = promotedPoll.budget_amount - spentBudget;
      
      // Generate daily stats for the last 7 days
      const dailyStats = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Generate some random data that adds up to the totals
        const dayImpressions = Math.floor(impressions / 7) + Math.floor(Math.random() * 50);
        const dayClicks = Math.floor(clicks / 7) + Math.floor(Math.random() * 10);
        const dayVotes = Math.floor(votes / 7) + Math.floor(Math.random() * 5);
        
        dailyStats.push({
          date: date.toISOString().split('T')[0],
          impressions: dayImpressions,
          clicks: dayClicks,
          votes: dayVotes
        });
      }

      return { 
        data: {
          impressions,
          clicks,
          votes,
          ctr,
          conversionRate,
          costPerVote: promotedPoll.cost_per_vote,
          spentBudget,
          remainingBudget,
          dailyStats
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get promoted poll analytics'
      };
    }
  }

  /**
   * Get user's promoted polls
   */
  static async getUserPromotedPolls(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
      includeDetails?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    promotedPolls: PromotedPoll[];
    totalCount: number;
  }>> {
    try {
      const { limit = 10, offset = 0, status, includeDetails = false } = options;

      // Get all sponsors owned by the user
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

      // Get promoted polls for these sponsors
      let query = supabase
        .from('promoted_polls')
        .select(`
          *,
          ${includeDetails ? `
          poll:poll_id(*),
          sponsor:sponsor_id(*)
          ` : ''}
        `, { count: 'exact' })
        .in('sponsor_id', sponsorIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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
   * Get active promoted polls for display
   */
  static async getActivePromotedPolls(
    limit: number = 5,
    country?: string
  ): Promise<ServiceResponse<PromotedPoll[]>> {
    try {
      let query = supabase
        .from('promoted_polls')
        .select(`
          *,
          poll:poll_id(*)
        `)
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .order('current_votes', { ascending: true })
        .limit(limit);

      // If country is provided, filter by polls that are relevant to that country
      if (country) {
        query = query.or(`poll.type.eq.global,and(poll.type.eq.country,poll.country.eq.${country})`);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get active promoted polls'
      };
    }
  }

  /**
   * Record a vote on a promoted poll
   */
  static async recordPromotedPollVote(
    promotedPollId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Get the promoted poll
      const { data: promotedPoll, error: fetchError } = await supabase
        .from('promoted_polls')
        .select('*')
        .eq('id', promotedPollId)
        .eq('status', 'active')
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (!promotedPoll) {
        return { data: null, error: 'Promoted poll not found or not active' };
      }

      // Check if target votes has been reached
      if (promotedPoll.current_votes >= promotedPoll.target_votes) {
        // Update status to completed
        await supabase
          .from('promoted_polls')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', promotedPollId);

        return { data: false, error: 'Target votes already reached' };
      }

      // Increment the current votes
      const { error } = await supabase
        .from('promoted_polls')
        .update({
          current_votes: promotedPoll.current_votes + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotedPollId);

      if (error) {
        return { data: null, error: error.message };
      }

      // Check if this vote reached the target
      if (promotedPoll.current_votes + 1 >= promotedPoll.target_votes) {
        // Update status to completed
        await supabase
          .from('promoted_polls')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', promotedPollId);
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record promoted poll vote'
      };
    }
  }

  /**
   * Get promoted poll settings
   */
  static async getPromotedPollSettings(): Promise<ServiceResponse<{
    default_cost_per_vote: number;
    minimum_budget: number;
    maximum_budget: number;
    points_to_usd_conversion: number;
    is_enabled: boolean;
  }>> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('category', 'promoted_polls')
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      // Default settings if none found
      const defaultSettings = {
        default_cost_per_vote: 0.05,
        minimum_budget: 10,
        maximum_budget: 1000,
        points_to_usd_conversion: 100,
        is_enabled: true
      };

      return { 
        data: data?.settings || defaultSettings, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get promoted poll settings'
      };
    }
  }

  /**
   * Update promoted poll status
   */
  static async updatePromotedPollStatus(
    userId: string,
    promotedPollId: string,
    status: 'active' | 'paused' | 'completed' | 'rejected',
    notes?: string
  ): Promise<ServiceResponse<PromotedPoll>> {
    try {
      // Check if user is admin
      const { data: userProfile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = userProfile?.role === 'admin';

      if (!isAdmin) {
        // Check if user owns the sponsor
        const { data: promotedPoll, error: fetchError } = await supabase
          .from('promoted_polls')
          .select(`
            *,
            sponsor:sponsor_id(user_id)
          `)
          .eq('id', promotedPollId)
          .maybeSingle();

        if (fetchError) {
          return { data: null, error: fetchError.message };
        }

        if (!promotedPoll) {
          return { data: null, error: 'Promoted poll not found' };
        }

        const isOwner = promotedPoll.sponsor?.user_id === userId;

        if (!isOwner) {
          return { data: null, error: 'You do not have permission to update this promoted poll' };
        }

        // Non-admins can only pause or resume their own polls
        if (status !== 'paused' && status !== 'active') {
          return { data: null, error: 'You can only pause or resume your own polls' };
        }

        // Check if the current status allows the requested transition
        if (status === 'paused' && promotedPoll.status !== 'active') {
          return { data: null, error: 'Only active polls can be paused' };
        }

        if (status === 'active' && promotedPoll.status !== 'paused') {
          return { data: null, error: 'Only paused polls can be resumed' };
        }
      }

      // Prepare updates
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      // If status is active and it's an admin, set approved_by and approved_at
      if (status === 'active' && isAdmin) {
        updateData.approved_by = userId;
        updateData.approved_at = new Date().toISOString();
      }

      // Update the promoted poll
      const { data, error } = await supabase
        .from('promoted_polls')
        .update(updateData)
        .eq('id', promotedPollId)
        .select(`
          *,
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
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
   * Get all promoted polls (admin only)
   */
  static async getAllPromotedPolls(
    adminId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
      payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
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
        limit = 10, 
        offset = 0, 
        status, 
        payment_status,
        includeDetails = false
      } = options;

      let query = supabase
        .from('promoted_polls')
        .select(`
          *,
          ${includeDetails ? `
          poll:poll_id(*),
          sponsor:sponsor_id(*),
          approver:approved_by(name, email)
          ` : ''}
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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
}

// Export individual functions for backward compatibility and easier testing
export const {
  getPromotedPolls,
  getPromotedPollById,
  createPromotedPoll,
  updatePromotedPoll,
  approvePromotedPoll,
  rejectPromotedPoll,
  pausePromotedPoll,
  resumePromotedPoll,
  processPayment,
  retryPromotedPollPayment,
  getPromotedPollAnalytics,
  getUserPromotedPolls,
  getActivePromotedPolls,
  recordPromotedPollVote,
  getPromotedPollSettings,
  updatePromotedPollStatus,
  getAllPromotedPolls
} = PromotedPollService;