import { useState, useEffect } from 'react';
import { ProfileService } from '../services/profileService';
import { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface LeaderboardEntry extends Profile {
  rank: number;
}

/**
 * Custom hook for leaderboard operations
 * 
 * This hook provides a convenient way to fetch and manage leaderboard data
 * with support for global and country-specific leaderboards.
 */
export const useLeaderboard = () => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countryLeaderboard, setCountryLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalLeaderboard = async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.fetchProfiles({
      limit,
      orderBy: 'points',
      order: 'desc'
    });
    
    if (serviceError) {
      setError(serviceError);
    } else {
      // Add rank to each entry
      const leaderboard = (data?.profiles || []).map((profile, index) => ({
        ...profile,
        rank: index + 1
      }));
      setGlobalLeaderboard(leaderboard);
    }
    
    setLoading(false);
  };

  const fetchCountryLeaderboard = async (country: string, limit: number = 50) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.fetchProfiles({
      limit,
      orderBy: 'points',
      order: 'desc',
      country
    });
    
    if (serviceError) {
      setError(serviceError);
    } else {
      // Add rank to each entry
      const leaderboard = (data?.profiles || []).map((profile, index) => ({
        ...profile,
        rank: index + 1
      }));
      setCountryLeaderboard(leaderboard);
    }
    
    setLoading(false);
  };

  const getUserRank = async (userId: string): Promise<{ 
    success: boolean; 
    globalRank?: number; 
    countryRank?: number; 
    error?: string 
  }> => {
    setLoading(true);
    setError(null);
    
    const { data: globalRank, error: globalError } = await ProfileService.getUserRank(userId);
    
    setLoading(false);
    
    if (globalError) {
      setError(globalError);
      return { success: false, error: globalError };
    }
    
    // For country rank, we'd need to implement a similar function with country filtering
    // For now, just return global rank
    return { 
      success: true, 
      globalRank: globalRank || undefined,
      countryRank: undefined // TODO: Implement country-specific ranking
    };
  };

  const getLeaderboardStats = async (): Promise<{
    success: boolean;
    stats?: {
      totalUsers: number;
      averagePoints: number;
      topCountries: { country: string; userCount: number }[];
    };
    error?: string;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get total users
      const { data: allProfiles, error: profilesError } = await ProfileService.fetchProfiles({
        limit: 1000, // Get more for stats calculation
        orderBy: 'points',
        order: 'desc'
      });
      
      if (profilesError) {
        setError(profilesError);
        setLoading(false);
        return { success: false, error: profilesError };
      }
      
      const profiles = allProfiles?.profiles || [];
      const totalUsers = profiles.length;
      const averagePoints = profiles.length > 0 
        ? Math.round(profiles.reduce((sum, p) => sum + p.points, 0) / profiles.length)
        : 0;
      
      // Calculate top countries
      const countryCount: Record<string, number> = {};
      profiles.forEach(profile => {
        if (profile.country) {
          countryCount[profile.country] = (countryCount[profile.country] || 0) + 1;
        }
      });
      
      const topCountries = Object.entries(countryCount)
        .map(([country, userCount]) => ({ country, userCount }))
        .sort((a, b) => b.userCount - a.userCount)
        .slice(0, 10);
      
      setLoading(false);
      
      return {
        success: true,
        stats: {
          totalUsers,
          averagePoints,
          topCountries
        }
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get leaderboard stats');
      setLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get leaderboard stats' 
      };
    }
  };

  useEffect(() => {
    // Auto-fetch global leaderboard when hook is initialized
    fetchGlobalLeaderboard();
  }, []);

  return {
    globalLeaderboard,
    countryLeaderboard,
    loading,
    error,
    fetchGlobalLeaderboard,
    fetchCountryLeaderboard,
    getUserRank,
    getLeaderboardStats,
    refetch: () => fetchGlobalLeaderboard()
  };
};