import { useState, useEffect } from 'react';
import { ReferralService } from '../services/referralService';
import type { ReferralStats, ReferralHistory } from '../services/referralService';

/**
 * Custom hook for referral operations
 * 
 * This hook provides a convenient way to interact with referral data
 * and can be used by components that need referral functionality
 * without directly accessing the service layer.
 */
export const useReferrals = (userId?: string) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistory[]>([]);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (id: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ReferralService.getReferralStats(id);
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setStats(data);
    }
    
    setLoading(false);
  };

  const fetchHistory = async (id: string, options: {
    limit?: number;
    type?: 'referral_signup' | 'referral_bonus';
  } = {}) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ReferralService.getReferralHistory(id, options);
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setHistory(data || []);
    }
    
    setLoading(false);
  };

  const fetchReferredUsers = async (id: string, options: {
    limit?: number;
    orderBy?: 'created_at' | 'points';
    order?: 'asc' | 'desc';
  } = {}) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ReferralService.getReferredUsers(id, options);
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setReferredUsers(data || []);
    }
    
    setLoading(false);
  };

  const validateReferralCode = async (code: string): Promise<{
    success: boolean;
    valid?: boolean;
    referrerName?: string;
    error?: string;
  }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ReferralService.validateReferralCode(code);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { 
        success: true, 
        valid: data?.valid,
        referrerName: data?.referrerName
      };
    }
  };

  const getReferralLeaderboard = async (options: {
    limit?: number;
    timeframe?: 'all' | 'month' | 'week';
  } = {}): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ReferralService.getReferralLeaderboard(options);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, data: data || [] };
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats(userId);
    }
  }, [userId]);

  return {
    stats,
    history,
    referredUsers,
    loading,
    error,
    fetchStats: (id: string) => fetchStats(id),
    fetchHistory,
    fetchReferredUsers,
    validateReferralCode,
    getReferralLeaderboard,
    refetch: () => {
      if (userId) {
        fetchStats(userId);
      }
    }
  };
};