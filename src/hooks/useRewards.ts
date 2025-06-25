import { useState, useEffect } from 'react';
import { RewardService } from '../services/rewardService';
import type {
  DailyRewardStatus,
  SpinResult,
  TriviaQuestion,
  TriviaResult,
  AdWatchResult,
  DailyRewardHistory,
  TriviaSubmission
} from '../types/api';

/**
 * Custom hook for daily rewards operations
 * 
 * This hook provides a convenient way to interact with daily rewards
 * and can be used by components that need reward functionality
 * without directly accessing the service layer.
 */
export const useRewards = (userId?: string) => {
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (id: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await RewardService.getDailyRewardStatus(id);
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setStatus(data);
    }
    
    setLoading(false);
  };

  const performSpin = async (): Promise<{ success: boolean; result?: SpinResult; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await RewardService.performSpin(userId);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Refresh status after spin
      await fetchStatus(userId);
      setLoading(false);
      return { success: true, result: data };
    }
  };

  const getTriviaQuestion = async (userCountry?: string): Promise<{ success: boolean; question?: TriviaQuestion; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await RewardService.getDailyTriviaQuestion(userId, userCountry);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, question: data };
    }
  };

  const submitTriviaAnswer = async (submission: TriviaSubmission): Promise<{ success: boolean; result?: TriviaResult; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await RewardService.submitTriviaAnswer(userId, submission);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Refresh status after trivia
      await fetchStatus(userId);
      setLoading(false);
      return { success: true, result: data };
    }
  };

  const watchAd = async (): Promise<{ success: boolean; result?: AdWatchResult; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await RewardService.recordAdWatch(userId);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Refresh status after ad watch
      await fetchStatus(userId);
      setLoading(false);
      return { success: true, result: data };
    }
  };

  const getHistory = async (options: {
    limit?: number;
    rewardType?: 'spin' | 'trivia' | 'watch';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ success: boolean; history?: DailyRewardHistory[]; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await RewardService.getRewardHistory(userId, options);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, history: data };
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStatus(userId);
    }
  }, [userId]);

  return {
    status,
    loading,
    error,
    fetchStatus: () => userId && fetchStatus(userId),
    performSpin,
    getTriviaQuestion,
    submitTriviaAnswer,
    watchAd,
    getHistory,
    refetch: () => userId && fetchStatus(userId)
  };
};