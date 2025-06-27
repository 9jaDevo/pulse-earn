import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';

export interface AppSettings {
  id: string;
  category: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Settings Service
 * 
 * This service handles all application settings operations including:
 * - Fetching settings by category
 * - Updating settings
 * - Managing system-wide configuration
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class SettingsService {
  /**
   * Get settings by category
   */
  static async getSettings(category: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('category', category)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data?.settings || {}, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get settings'
      };
    }
  }

  /**
   * Update settings for a category
   */
  static async updateSettings(
    adminId: string,
    category: string,
    settings: Record<string, any>
  ): Promise<ServiceResponse<Record<string, any>>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update settings' };
      }

      // Check if settings exist for this category
      const { data: existingSettings } = await supabase
        .from('app_settings')
        .select('id, settings')
        .eq('category', category)
        .maybeSingle();

      let result;
      
      if (existingSettings) {
        // Update existing settings
        const mergedSettings = {
          ...existingSettings.settings,
          ...settings
        };
        
        result = await supabase
          .from('app_settings')
          .update({
            settings: mergedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select('settings')
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('app_settings')
          .insert({
            category,
            settings
          })
          .select('settings')
          .single();
      }

      if (result.error) {
        return { data: null, error: result.error.message };
      }

      return { data: result.data.settings, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update settings'
      };
    }
  }

  /**
   * Get all settings
   */
  static async getAllSettings(): Promise<ServiceResponse<Record<string, Record<string, any>>>> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('category, settings');

      if (error) {
        return { data: null, error: error.message };
      }

      // Convert array to object with category as key
      const settingsObject = (data || []).reduce((acc, item) => {
        acc[item.category] = item.settings;
        return acc;
      }, {} as Record<string, Record<string, any>>);

      return { data: settingsObject, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get all settings'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getSettings,
  updateSettings,
  getAllSettings
} = SettingsService;