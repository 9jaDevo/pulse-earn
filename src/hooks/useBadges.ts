import { useState, useEffect } from 'react';
import { BadgeService } from '../services/badgeService';
import type { Badge, UserBadgeProgress, BadgeCreateRequest, BadgeUpdateRequest } from '../types/api';

/**
 * Custom hook for badge operations
 * 
 * This hook provides a convenient way to interact with badge data
 * and can be used by components that need badge functionality
 * without directly accessing the service layer.
 */
export const useBadges = (userId?: string) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userProgress, setUserProgress] = useState<UserBadgeProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await BadgeService.fetchBadges();
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setBadges(data || []);
    }
    
    setLoading(false);
  };

  const fetchUserProgress = async (id: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await BadgeService.getUserBadgeProgress(id);
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setUserProgress(data || []);
    }
    
    setLoading(false);
  };

  const checkAndAwardBadges = async (id: string): Promise<{ success: boolean; newBadges?: string[]; error?: string }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await BadgeService.checkAndAwardBadges(id);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      // Refresh user progress if badges were awarded
      if (data && data.length > 0) {
        await fetchUserProgress(id);
      }
      return { success: true, newBadges: data || [] };
    }
  };

  const createBadge = async (badgeData: BadgeCreateRequest): Promise<{ success: boolean; badge?: Badge; error?: string }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await BadgeService.createBadge(badgeData);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Add new badge to the list
      setBadges(prev => [...prev, data!]);
      setLoading(false);
      return { success: true, badge: data || undefined };
    }
  };

  const updateBadge = async (
    badgeId: string, 
    updates: BadgeUpdateRequest
  ): Promise<{ success: boolean; badge?: Badge; error?: string }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await BadgeService.updateBadge(badgeId, updates);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Update badge in the list
      setBadges(prev => prev.map(badge => 
        badge.id === badgeId ? data! : badge
      ));
      setLoading(false);
      return { success: true, badge: data || undefined };
    }
  };

  const getBadgeStats = async (): Promise<{ 
    success: boolean; 
    stats?: {
      totalBadges: number;
      activeBadges: number;
      mostEarnedBadge: { name: string; count: number } | null;
    }; 
    error?: string 
  }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await BadgeService.getBadgeStats();
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, stats: data || undefined };
    }
  };

  // Get earned badges count
  const getEarnedBadgesCount = (): number => {
    return userProgress.filter(bp => bp.earned).length;
  };

  // Get badges in progress count
  const getBadgesInProgressCount = (): number => {
    return userProgress.filter(bp => !bp.earned && bp.progress > 0).length;
  };

  // Get next badge to earn
  const getNextBadgeToEarn = (): UserBadgeProgress | null => {
    const inProgress = userProgress
      .filter(bp => !bp.earned && bp.progress > 0)
      .sort((a, b) => (b.progress / b.maxProgress) - (a.progress / a.maxProgress));
    
    return inProgress[0] || null;
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserProgress(userId);
    }
  }, [userId]);

  return {
    badges,
    userProgress,
    loading,
    error,
    fetchBadges,
    fetchUserProgress: (id: string) => fetchUserProgress(id),
    checkAndAwardBadges,
    createBadge,
    updateBadge,
    getBadgeStats,
    getEarnedBadgesCount,
    getBadgesInProgressCount,
    getNextBadgeToEarn,
    refetch: () => {
      fetchBadges();
      if (userId) fetchUserProgress(userId);
    }
  };
};