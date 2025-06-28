import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';
import type { MarketingMaterial, MarketingMaterialCreateRequest, MarketingMaterialUpdateRequest } from '../types/api';

/**
 * Marketing Service
 * 
 * This service handles all marketing-related operations including:
 * - Uploading marketing materials to Supabase Storage
 * - Managing marketing materials in the database
 * - Retrieving marketing materials for ambassadors
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class MarketingService {
  private static readonly STORAGE_BUCKET = 'marketing-materials';
  
  /**
   * Get all marketing materials with optional filtering
   */
  static async getMaterials(
    options: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
      materialType?: string;
      searchTerm?: string;
    } = {}
  ): Promise<ServiceResponse<{
    materials: MarketingMaterial[];
    totalCount: number;
  }>> {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        isActive, 
        materialType,
        searchTerm
      } = options;
      
      let query = supabase
        .from('marketing_materials')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
      
      if (materialType) {
        query = query.eq('material_type', materialType);
      }
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { 
        data: {
          materials: data || [],
          totalCount: count || 0
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get marketing materials'
      };
    }
  }
  
  /**
   * Get a single marketing material by ID
   */
  static async getMaterialById(materialId: string): Promise<ServiceResponse<MarketingMaterial>> {
    try {
      const { data, error } = await supabase
        .from('marketing_materials')
        .select('*')
        .eq('id', materialId)
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get marketing material'
      };
    }
  }
  
  /**
   * Upload a marketing material file and create a database record
   */
  static async uploadMaterial(
    adminId: string,
    file: File,
    materialData: MarketingMaterialCreateRequest
  ): Promise<ServiceResponse<MarketingMaterial>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can upload marketing materials' };
      }
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${materialData.material_type}/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        return { data: null, error: `Failed to upload file: ${uploadError.message}` };
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      const fileUrl = urlData.publicUrl;
      
      // Create database record
      const { data, error } = await supabase
        .from('marketing_materials')
        .insert({
          name: materialData.name,
          description: materialData.description,
          file_url: fileUrl,
          file_path: filePath,
          file_type: materialData.file_type,
          material_type: materialData.material_type,
          created_by: adminId,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        // If database insert fails, try to delete the uploaded file
        await supabase.storage
          .from(this.STORAGE_BUCKET)
          .remove([filePath]);
        
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to upload marketing material'
      };
    }
  }
  
  /**
   * Update a marketing material record
   */
  static async updateMaterial(
    adminId: string,
    materialId: string,
    updates: MarketingMaterialUpdateRequest
  ): Promise<ServiceResponse<MarketingMaterial>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update marketing materials' };
      }
      
      const { data, error } = await supabase
        .from('marketing_materials')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update marketing material'
      };
    }
  }
  
  /**
   * Delete a marketing material and its associated file
   */
  static async deleteMaterial(
    adminId: string,
    materialId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can delete marketing materials' };
      }
      
      // Get the material to get the file path
      const { data: material, error: materialError } = await supabase
        .from('marketing_materials')
        .select('file_path')
        .eq('id', materialId)
        .single();
      
      if (materialError) {
        return { data: null, error: materialError.message };
      }
      
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([material.file_path]);
      
      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if file deletion fails
      }
      
      // Delete the database record
      const { error: deleteError } = await supabase
        .from('marketing_materials')
        .delete()
        .eq('id', materialId);
      
      if (deleteError) {
        return { data: null, error: deleteError.message };
      }
      
      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete marketing material'
      };
    }
  }
  
  /**
   * Get distinct material types
   */
  static async getDistinctMaterialTypes(): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('marketing_materials')
        .select('material_type')
        .eq('is_active', true);
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Extract unique material types
      const types = [...new Set((data || []).map(item => item.material_type))].sort();
      
      return { data: types, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get material types'
      };
    }
  }
  
  /**
   * Check if marketing module is enabled
   */
  static async isMarketingModuleEnabled(): Promise<ServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('category', 'marketing')
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data: data?.settings?.is_enabled !== false, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to check if marketing module is enabled'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getMaterials,
  getMaterialById,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  getDistinctMaterialTypes,
  isMarketingModuleEnabled
} = MarketingService;