import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';
import type { Sponsor, SponsorCreateRequest, SponsorUpdateRequest } from '../types/api';

/**
 * Sponsor Service
 * 
 * This service handles all sponsor-related operations including:
 * - Creating and managing sponsors
 * - Retrieving sponsor information
 * - Verifying sponsors
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class SponsorService {
  /**
   * Get sponsor by ID
   */
  static async getSponsorById(sponsorId: string): Promise<ServiceResponse<Sponsor>> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', sponsorId)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get sponsor'
      };
    }
  }
  
  /**
   * Get sponsors for a user
   */
  static async getUserSponsors(userId: string): Promise<ServiceResponse<Sponsor[]>> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user sponsors'
      };
    }
  }
  
  /**
   * Create a new sponsor
   */
  static async createSponsor(
    userId: string,
    sponsorData: SponsorCreateRequest
  ): Promise<ServiceResponse<Sponsor>> {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .insert({
          user_id: userId,
          name: sponsorData.name,
          contact_email: sponsorData.contact_email,
          website_url: sponsorData.website_url,
          description: sponsorData.description,
          is_verified: false,
          is_active: true
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
        error: error instanceof Error ? error.message : 'Failed to create sponsor'
      };
    }
  }
  
  /**
   * Update a sponsor
   */
  static async updateSponsor(
    userId: string,
    sponsorId: string,
    updates: SponsorUpdateRequest
  ): Promise<ServiceResponse<Sponsor>> {
    try {
      // Check if user owns this sponsor or is an admin
      const { data: profile } = await ProfileService.fetchProfileById(userId);
      const isAdmin = profile?.role === 'admin';
      
      if (!isAdmin) {
        const { data: sponsor } = await supabase
          .from('sponsors')
          .select('user_id')
          .eq('id', sponsorId)
          .single();
        
        if (!sponsor || sponsor.user_id !== userId) {
          return { data: null, error: 'Unauthorized: You do not own this sponsor' };
        }
      }
      
      // Prepare updates
      const updateData: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Only admins can update verification status
      if (!isAdmin) {
        delete updateData.is_verified;
      }
      
      const { data, error } = await supabase
        .from('sponsors')
        .update(updateData)
        .eq('id', sponsorId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update sponsor'
      };
    }
  }
  
  /**
   * Verify a sponsor (admin only)
   */
  static async verifySponsor(
    adminId: string,
    sponsorId: string,
    isVerified: boolean
  ): Promise<ServiceResponse<Sponsor>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can verify sponsors' };
      }
      
      const { data, error } = await supabase
        .from('sponsors')
        .update({
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', sponsorId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to verify sponsor'
      };
    }
  }
  
  /**
   * Get all sponsors (admin only)
   */
  static async getAllSponsors(
    adminId: string,
    options: {
      limit?: number;
      offset?: number;
      isVerified?: boolean;
      isActive?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    sponsors: Sponsor[];
    totalCount: number;
  }>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can view all sponsors' };
      }
      
      const { limit = 50, offset = 0, isVerified, isActive } = options;
      
      let query = supabase
        .from('sponsors')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (isVerified !== undefined) {
        query = query.eq('is_verified', isVerified);
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
          sponsors: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get sponsors'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getSponsorById,
  getUserSponsors,
  createSponsor,
  updateSponsor,
  verifySponsor,
  getAllSponsors
} = SponsorService;