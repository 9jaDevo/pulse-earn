import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import { SettingsService } from './settingsService';
import type { ServiceResponse } from './profileService';
import type { Transaction, TransactionCreateRequest, PaymentMethod } from '../types/api';

/**
 * Payment Service
 * 
 * This service handles all payment-related operations including:
 * - Processing payments from wallet balance
 * - Initiating external payment gateway transactions
 * - Recording transaction history
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class PaymentService {
  /**
   * Get available payment methods
   */
  static async getPaymentMethods(): Promise<ServiceResponse<PaymentMethod[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payment methods'
      };
    }
  }
  
  /**
   * Get payment method by ID
   */
  static async getPaymentMethodById(methodId: string): Promise<ServiceResponse<PaymentMethod>> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', methodId)
        .eq('is_active', true)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payment method'
      };
    }
  }
  
  /**
   * Process payment from wallet balance
   */
  static async processWalletPayment(
    userId: string,
    amount: number,
    promotedPollId?: string
  ): Promise<ServiceResponse<Transaction>> {
    try {
      // Get settings for points to USD conversion
      const { data: settings } = await SettingsService.getSettings('promoted_polls');
      const pointsToUsdConversion = settings?.points_to_usd_conversion || 100; // Default: 100 points = $1
      
      // Calculate points needed
      const pointsNeeded = amount * pointsToUsdConversion;
      
      // Check if user has enough points
      const { data: profile, error: profileError } = await ProfileService.fetchProfileById(userId);
      
      if (profileError || !profile) {
        return { data: null, error: profileError || 'User profile not found' };
      }
      
      if (profile.points < pointsNeeded) {
        return { 
          data: null, 
          error: `Insufficient points. You need ${pointsNeeded} points (${profile.points} available).` 
        };
      }
      
      // Start a transaction
      // In a real implementation, this would be a database transaction
      
      // 1. Deduct points from user's profile
      const { error: pointsError } = await ProfileService.updateUserPoints(userId, -pointsNeeded);
      
      if (pointsError) {
        return { data: null, error: pointsError };
      }
      
      // 2. Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          promoted_poll_id: promotedPollId,
          amount,
          currency: 'USD',
          payment_method: 'wallet',
          status: 'completed',
          metadata: {
            points_used: pointsNeeded,
            conversion_rate: pointsToUsdConversion
          }
        })
        .select()
        .single();
      
      if (transactionError) {
        // If transaction creation fails, try to refund the points
        await ProfileService.updateUserPoints(userId, pointsNeeded);
        return { data: null, error: transactionError.message };
      }
      
      // 3. If this is for a promoted poll, update its payment status
      if (promotedPollId) {
        const { error: updateError } = await supabase
          .from('promoted_polls')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', promotedPollId);
        
        if (updateError) {
          console.error('Failed to update promoted poll payment status:', updateError);
          // Continue even if update fails, as the payment was successful
        }
      }
      
      return { data: transaction, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to process wallet payment'
      };
    }
  }
  
  /**
   * Create a transaction record
   */
  static async createTransaction(
    userId: string,
    transactionData: TransactionCreateRequest
  ): Promise<ServiceResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          promoted_poll_id: transactionData.promoted_poll_id,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          payment_method: transactionData.payment_method,
          status: 'pending',
          metadata: transactionData.metadata || {}
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
        error: error instanceof Error ? error.message : 'Failed to create transaction'
      };
    }
  }
  
  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    transactionId: string,
    status: 'completed' | 'failed' | 'refunded',
    gatewayTransactionId?: string
  ): Promise<ServiceResponse<Transaction>> {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (gatewayTransactionId) {
        updateData.gateway_transaction_id = gatewayTransactionId;
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // If transaction is for a promoted poll and status is completed, update the poll's payment status
      if (data.promoted_poll_id && status === 'completed') {
        const { error: updateError } = await supabase
          .from('promoted_polls')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.promoted_poll_id);
        
        if (updateError) {
          console.error('Failed to update promoted poll payment status:', updateError);
          // Continue even if update fails, as the payment was successful
        }
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update transaction status'
      };
    }
  }
  
  /**
   * Get user's transaction history
   */
  static async getUserTransactions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'completed' | 'failed' | 'refunded';
    } = {}
  ): Promise<ServiceResponse<{
    transactions: Transaction[];
    totalCount: number;
  }>> {
    try {
      const { limit = 50, offset = 0, status } = options;
      
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
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
          transactions: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user transactions'
      };
    }
  }
  
  /**
   * Get all transactions (admin only)
   */
  static async getAllTransactions(
    adminId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'completed' | 'failed' | 'refunded';
      payment_method?: 'wallet' | 'stripe' | 'paypal' | 'paystack';
    } = {}
  ): Promise<ServiceResponse<{
    transactions: Transaction[];
    totalCount: number;
  }>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can view all transactions' };
      }
      
      const { limit = 50, offset = 0, status, payment_method } = options;
      
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (payment_method) {
        query = query.eq('payment_method', payment_method);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { 
        data: {
          transactions: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get all transactions'
      };
    }
  }
  
  /**
   * Initialize a Stripe payment
   * This creates a transaction record and calls the Stripe API to create a payment intent
   */
  static async initializeStripePayment(
    userId: string,
    amount: number,
    promotedPollId?: string
  ): Promise<ServiceResponse<{
    clientSecret: string;
    transactionId: string;
  }>> {
    try {
      // Create a pending transaction
      const { data: transaction, error: transactionError } = await this.createTransaction(userId, {
        amount,
        payment_method: 'stripe',
        promoted_poll_id: promotedPollId
      });
      
      if (transactionError) {
        return { data: null, error: transactionError };
      }
      
      if (!transaction) {
        return { data: null, error: 'Failed to create transaction record' };
      }
      
      try {
        // Call the Supabase Edge Function to create a payment intent
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount,
            userId,
            transactionId: transaction.id,
            promotedPollId: promotedPollId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const { clientSecret, paymentIntentId } = await response.json();
        
        if (!clientSecret) {
          throw new Error('No client secret returned from payment intent creation');
        }
        
        // Update transaction with Stripe payment intent ID
        await supabase
          .from('transactions')
          .update({
            stripe_payment_intent_id: paymentIntentId,
            metadata: {
              ...transaction.metadata,
              payment_intent_id: paymentIntentId
            }
          })
          .eq('id', transaction.id);
        
        return { 
          data: {
            clientSecret,
            transactionId: transaction.id
          }, 
          error: null 
        };
      } catch (err) {
        // If payment intent creation fails, mark the transaction as failed
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            metadata: {
              ...transaction.metadata,
              error: err instanceof Error ? err.message : 'Failed to create payment intent'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);
        
        throw err;
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to initialize Stripe payment'
      };
    }
  }
  
  /**
   * Initialize a PayPal payment (placeholder)
   * In a real implementation, this would create a PayPal order
   */
  static async initializePayPalPayment(
    userId: string,
    amount: number,
    promotedPollId?: string
  ): Promise<ServiceResponse<{
    approvalUrl: string;
    transactionId: string;
  }>> {
    try {
      // This is a placeholder implementation
      // In a real implementation, this would call a Supabase Edge Function or external API
      
      // Create a pending transaction
      const { data: transaction, error } = await this.createTransaction(userId, {
        amount,
        payment_method: 'paypal',
        promoted_poll_id: promotedPollId
      });
      
      if (error) {
        return { data: null, error };
      }
      
      // In a real implementation, this would return a PayPal approval URL
      // For now, we'll return a fake approval URL
      return { 
        data: {
          approvalUrl: `https://paypal.com/checkout/fake-order-${Date.now()}`,
          transactionId: transaction.id
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to initialize PayPal payment'
      };
    }
  }
  
  /**
   * Initialize a Paystack payment
   * This creates a transaction record and calls the Paystack API to create a transaction
   */
  static async initializePaystackPayment(
    userId: string,
    amount: number,
    promotedPollId?: string
  ): Promise<ServiceResponse<{
    authorizationUrl: string;
    transactionId: string;
  }>> {
    try {
      // Create a pending transaction
      const { data: transaction, error: transactionError } = await this.createTransaction(userId, {
        amount,
        payment_method: 'paystack',
        promoted_poll_id: promotedPollId
      });
      
      if (transactionError) {
        return { data: null, error: transactionError };
      }
      
      if (!transaction) {
        return { data: null, error: 'Failed to create transaction record' };
      }
      
      try {
        // Call the Supabase Edge Function to initialize Paystack payment
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-initiate-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            amount,
            userId,
            transactionId: transaction.id,
            promotedPollId: promotedPollId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize Paystack payment');
        }
        
        const { authorizationUrl, reference } = await response.json();
        
        if (!authorizationUrl) {
          throw new Error('No authorization URL returned from Paystack');
        }
        
        // Update transaction with Paystack reference
        await supabase
          .from('transactions')
          .update({
            gateway_transaction_id: reference,
            metadata: {
              ...transaction.metadata,
              paystack_reference: reference
            }
          })
          .eq('id', transaction.id);
        
        return { 
          data: {
            authorizationUrl,
            transactionId: transaction.id
          }, 
          error: null 
        };
      } catch (err) {
        // If payment initialization fails, mark the transaction as failed
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            metadata: {
              ...transaction.metadata,
              error: err instanceof Error ? err.message : 'Failed to initialize Paystack payment'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);
        
        throw err;
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to initialize Paystack payment'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getPaymentMethods,
  getPaymentMethodById,
  processWalletPayment,
  createTransaction,
  updateTransactionStatus,
  getUserTransactions,
  getAllTransactions,
  initializeStripePayment,
  initializePayPalPayment,
  initializePaystackPayment
} = PaymentService;