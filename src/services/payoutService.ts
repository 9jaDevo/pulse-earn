import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';
import type { 
  PayoutMethod, 
  PayoutRequest, 
  PayoutRequestCreateRequest, 
  PayoutRequestUpdateRequest,
  PayoutMethodCreateRequest,
  PayoutMethodUpdateRequest
} from '../types/api';

/**
 * Payout Service
 * 
 * This service handles all payout-related operations including:
 * - Managing payout methods
 * - Processing payout requests
 * - Tracking payout history
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class PayoutService {
  /**
   * Get available payout methods
   */
  static async getPayoutMethods(
    options: {
      activeOnly?: boolean;
    } = {}
  ): Promise<ServiceResponse<PayoutMethod[]>> {
    try {
      const { activeOnly = true } = options;
      
      let query = supabase
        .from('payout_methods')
        .select('*')
        .order('name');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payout methods'
      };
    }
  }
  
  /**
   * Create a new payout method (admin only)
   */
  static async createPayoutMethod(
    adminId: string,
    methodData: PayoutMethodCreateRequest
  ): Promise<ServiceResponse<PayoutMethod>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can create payout methods' };
      }
      
      const { data, error } = await supabase
        .from('payout_methods')
        .insert({
          name: methodData.name,
          description: methodData.description,
          is_automatic: methodData.is_automatic,
          config: methodData.config || {}
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
        error: error instanceof Error ? error.message : 'Failed to create payout method'
      };
    }
  }
  
  /**
   * Update a payout method (admin only)
   */
  static async updatePayoutMethod(
    adminId: string,
    methodId: string,
    updates: PayoutMethodUpdateRequest
  ): Promise<ServiceResponse<PayoutMethod>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update payout methods' };
      }
      
      const { data, error } = await supabase
        .from('payout_methods')
        .update({
          name: updates.name,
          description: updates.description,
          is_automatic: updates.is_automatic,
          is_active: updates.is_active,
          config: updates.config,
          updated_at: new Date().toISOString()
        })
        .eq('id', methodId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payout method'
      };
    }
  }
  
  /**
   * Get ambassador's payable balance
   */
  static async getPayableBalance(userId: string): Promise<ServiceResponse<number>> {
    try {
      const { data, error } = await supabase
        .rpc('get_ambassador_payable_balance', {
          p_user_id: userId
        });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payable balance'
      };
    }
  }
  
  /**
   * Request a payout
   */
  static async requestPayout(
    userId: string,
    request: PayoutRequestCreateRequest
  ): Promise<ServiceResponse<PayoutRequest>> {
    try {
      // Check if user has an ambassador profile
      const { data: ambassador, error: ambassadorError } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (ambassadorError || !ambassador) {
        return { data: null, error: 'You must be an active ambassador to request payouts' };
      }
      
      // Check if amount is valid
      if (request.amount <= 0) {
        return { data: null, error: 'Payout amount must be greater than zero' };
      }
      
      // Check if user has enough balance
      const { data: balance, error: balanceError } = await this.getPayableBalance(userId);
      
      if (balanceError) {
        return { data: null, error: balanceError };
      }
      
      if (balance < request.amount) {
        return { 
          data: null, 
          error: `Insufficient balance. Your available balance is $${balance.toFixed(2)}`
        };
      }
      
      // Check if payout method exists and is active
      const { data: methods, error: methodsError } = await this.getPayoutMethods();
      
      if (methodsError) {
        return { data: null, error: methodsError };
      }
      
      const method = methods.find(m => m.name === request.payout_method);
      
      if (!method) {
        return { data: null, error: 'Invalid payout method' };
      }
      
      // Check minimum payout amount
      const minPayout = method.config?.min_payout || 0;
      
      if (request.amount < minPayout) {
        return { 
          data: null, 
          error: `Minimum payout amount for ${method.name} is $${minPayout.toFixed(2)}`
        };
      }
      
      // Get user profile for payout details
      const { data: profile, error: profileError } = await ProfileService.fetchProfileById(userId);
      
      if (profileError || !profile) {
        return { data: null, error: 'User profile not found' };
      }
      
      // Validate payout details based on method
      if (method.name === 'PayPal' && !profile.paypal_email && !request.payout_details?.paypal_email) {
        return { data: null, error: 'PayPal email is required for PayPal payouts' };
      }
      
      if (method.name === 'Bank Transfer' && 
          Object.keys(profile.bank_details || {}).length === 0 && 
          !request.payout_details?.bank_details) {
        return { data: null, error: 'Bank details are required for bank transfers' };
      }
      
      // Prepare payout details
      const payoutDetails = {
        ...request.payout_details,
        paypal_email: request.payout_details?.paypal_email || profile.paypal_email,
        bank_details: request.payout_details?.bank_details || profile.bank_details,
        user_name: profile.name,
        user_email: profile.email,
        user_country: profile.country
      };
      
      // Create payout request
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          user_id: userId,
          amount: request.amount,
          payout_method: request.payout_method,
          payout_details: payoutDetails,
          status: 'pending'
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
        error: error instanceof Error ? error.message : 'Failed to request payout'
      };
    }
  }
  
  /**
   * Get user's payout requests
   */
  static async getUserPayoutRequests(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'approved' | 'rejected' | 'processed';
    } = {}
  ): Promise<ServiceResponse<{
    requests: PayoutRequest[];
    totalCount: number;
  }>> {
    try {
      const { limit = 10, offset = 0, status } = options;
      
      let query = supabase
        .from('payout_requests')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('requested_at', { ascending: false })
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
          requests: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payout requests'
      };
    }
  }
  
  /**
   * Get all payout requests (admin only)
   */
  static async getAllPayoutRequests(
    adminId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'approved' | 'rejected' | 'processed';
      userId?: string;
    } = {}
  ): Promise<ServiceResponse<{
    requests: PayoutRequest[];
    totalCount: number;
  }>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can view all payout requests' };
      }
      
      const { limit = 10, offset = 0, status, userId } = options;
      
      let query = supabase
        .from('payout_requests')
        .select(`
          *,
          user:user_id(name, email),
          processor:processed_by(name, email)
        `, { count: 'exact' })
        .order('requested_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { 
        data: {
          requests: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payout requests'
      };
    }
  }
  
  /**
   * Update payout request status (admin only)
   */
  static async updatePayoutRequestStatus(
    adminId: string,
    requestId: string,
    updates: PayoutRequestUpdateRequest
  ): Promise<ServiceResponse<PayoutRequest>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update payout requests' };
      }
      
      // Get the payout request
      const { data: payoutRequest, error: requestError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError || !payoutRequest) {
        return { data: null, error: 'Payout request not found' };
      }
      
      // Prepare updates
      const updateData: Record<string, any> = {
        status: updates.status,
        admin_notes: updates.admin_notes,
        updated_at: new Date().toISOString()
      };
      
      // If status is processed, add processed_at and processed_by
      if (updates.status === 'processed') {
        updateData.processed_at = new Date().toISOString();
        updateData.processed_by = adminId;
        updateData.transaction_id = updates.transaction_id;
        
        // Update ambassador's total_payouts
        const { error: ambassadorError } = await supabase
          .from('ambassadors')
          .update({
            total_payouts: supabase.raw(`total_payouts + ${payoutRequest.amount}`),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', payoutRequest.user_id);
        
        if (ambassadorError) {
          return { data: null, error: `Failed to update ambassador payouts: ${ambassadorError.message}` };
        }
      }
      
      // Update the payout request
      const { data, error } = await supabase
        .from('payout_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payout request'
      };
    }
  }
  
  /**
   * Get payout statistics
   */
  static async getPayoutStats(
    adminId: string
  ): Promise<ServiceResponse<{
    totalProcessed: number;
    totalPending: number;
    totalAmount: number;
    pendingAmount: number;
    averageAmount: number;
    processingTime: number;
  }>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can view payout statistics' };
      }
      
      // Get total processed payouts
      const { count: totalProcessed } = await supabase
        .from('payout_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'processed');
      
      // Get total pending payouts
      const { count: totalPending } = await supabase
        .from('payout_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Get total amount processed
      const { data: totalAmountData } = await supabase
        .from('payout_requests')
        .select('amount')
        .eq('status', 'processed');
      
      const totalAmount = totalAmountData
        ? totalAmountData.reduce((sum, item) => sum + item.amount, 0)
        : 0;
      
      // Get total amount pending
      const { data: pendingAmountData } = await supabase
        .from('payout_requests')
        .select('amount')
        .eq('status', 'pending');
      
      const pendingAmount = pendingAmountData
        ? pendingAmountData.reduce((sum, item) => sum + item.amount, 0)
        : 0;
      
      // Calculate average amount
      const averageAmount = totalProcessed > 0 ? totalAmount / totalProcessed : 0;
      
      // Calculate average processing time
      const { data: processedRequests } = await supabase
        .from('payout_requests')
        .select('requested_at, processed_at')
        .eq('status', 'processed')
        .not('processed_at', 'is', null);
      
      let totalProcessingTime = 0;
      let processedCount = 0;
      
      if (processedRequests) {
        processedRequests.forEach(request => {
          if (request.requested_at && request.processed_at) {
            const requestedAt = new Date(request.requested_at);
            const processedAt = new Date(request.processed_at);
            const processingTime = (processedAt.getTime() - requestedAt.getTime()) / (1000 * 60 * 60); // in hours
            totalProcessingTime += processingTime;
            processedCount++;
          }
        });
      }
      
      const processingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;
      
      return {
        data: {
          totalProcessed: totalProcessed || 0,
          totalPending: totalPending || 0,
          totalAmount,
          pendingAmount,
          averageAmount,
          processingTime
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payout statistics'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getPayoutMethods,
  createPayoutMethod,
  updatePayoutMethod,
  getPayableBalance,
  requestPayout,
  getUserPayoutRequests,
  getAllPayoutRequests,
  updatePayoutRequestStatus,
  getPayoutStats
} = PayoutService;