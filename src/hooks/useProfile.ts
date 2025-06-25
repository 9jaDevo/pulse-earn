import { useState, useEffect } from 'react';
import { ProfileService } from '../services/profileService';
import { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Custom hook for profile operations
 * 
 * This hook provides a convenient way to interact with profile data
 * and can be used by components that need profile functionality
 * without directly accessing the service layer.
 */
export const useProfile = (userId?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.fetchProfileById(id);
    
    if (serviceError) {
      setError(serviceError);
    } else {
      setProfile(data);
    }
    
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) {
      setError('No user ID provided');
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.updateUserProfile(userId, updates);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      setProfile(data);
      setLoading(false);
      return { success: true, error: null };
    }
  };

  const addPoints = async (points: number) => {
    if (!userId) {
      setError('No user ID provided');
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.updateUserPoints(userId, points);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      setProfile(data);
      setLoading(false);
      return { success: true, error: null };
    }
  };

  const addBadge = async (badge: string) => {
    if (!userId) {
      setError('No user ID provided');
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await ProfileService.addBadgeToUser(userId, badge);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      setProfile(data);
      setLoading(false);
      return { success: true, error: null };
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    addPoints,
    addBadge,
    refetch: () => userId && fetchProfile(userId)
  };
};