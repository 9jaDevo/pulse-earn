import { supabase } from '../lib/supabase';
import type { ServiceResponse } from './profileService';

/**
 * OpenAI Service
 * 
 * This service handles interactions with OpenAI via Supabase Edge Functions
 * for generating poll questions and other AI-powered features.
 */
export class OpenAIService {
  /**
   * Generate poll questions using OpenAI
   */
  static async generatePolls(
    adminId: string,
    options: {
      numPolls?: number;
      categories?: string[];
      topic?: string;
      country?: string;
    } = {}
  ): Promise<ServiceResponse<{
    createdPolls: any[];
    errors: any[];
    totalCreated: number;
    totalErrors: number;
  }>> {
    try {
      const { numPolls = 1, categories = [], topic = "", country = null } = options;
      
      // Call the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-daily-polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          adminId,
          numPolls,
          categories,
          topic,
          country
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData.error || 'Failed to generate polls' };
      }
      
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate polls'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  generatePolls
} = OpenAIService;