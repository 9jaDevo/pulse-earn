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

export interface CurrencyExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

export interface CountryCurrencySettings {
  id: string;
  country_code: string;
  enabled_currencies: string[];
  default_currency: string;
  updated_at: string;
}

/**
 * Settings Service
 * 
 * This service handles all application settings operations including:
 * - Fetching settings by category
 * - Updating settings
 * - Managing system-wide configuration
 * - Currency and payment gateway settings
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

  /**
   * Get currency settings for a country
   */
  static async getCountryCurrencySettings(
    countryCode: string
  ): Promise<ServiceResponse<CountryCurrencySettings>> {
    try {
      const { data, error } = await supabase
        .from('country_currency_settings')
        .select('*')
        .eq('country_code', countryCode)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get country currency settings'
      };
    }
  }

  /**
   * Update currency settings for a country (admin only)
   */
  static async updateCountryCurrencySettings(
    adminId: string,
    countryCode: string,
    enabledCurrencies: string[],
    defaultCurrency: string
  ): Promise<ServiceResponse<CountryCurrencySettings>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update currency settings' };
      }

      // Check if settings exist for this country
      const { data: existingSettings } = await supabase
        .from('country_currency_settings')
        .select('id')
        .eq('country_code', countryCode)
        .maybeSingle();

      let result;
      
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('country_currency_settings')
          .update({
            enabled_currencies: enabledCurrencies,
            default_currency: defaultCurrency,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('country_currency_settings')
          .insert({
            country_code: countryCode,
            enabled_currencies: enabledCurrencies,
            default_currency: defaultCurrency
          })
          .select()
          .single();
      }

      if (result.error) {
        return { data: null, error: result.error.message };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update country currency settings'
      };
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  static async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ServiceResponse<number>> {
    try {
      // If currencies are the same, return 1
      if (fromCurrency === toCurrency) {
        return { data: 1, error: null };
      }

      const { data, error } = await supabase
        .from('currency_exchange_rates')
        .select('rate')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data) {
        // Try to calculate via USD if direct rate not found
        const { data: fromToUsd } = await supabase
          .from('currency_exchange_rates')
          .select('rate')
          .eq('from_currency', fromCurrency)
          .eq('to_currency', 'USD')
          .maybeSingle();

        const { data: usdToTo } = await supabase
          .from('currency_exchange_rates')
          .select('rate')
          .eq('from_currency', 'USD')
          .eq('to_currency', toCurrency)
          .maybeSingle();

        if (fromToUsd && usdToTo) {
          return { data: fromToUsd.rate * usdToTo.rate, error: null };
        }

        return { data: null, error: `Exchange rate not found for ${fromCurrency} to ${toCurrency}` };
      }

      return { data: data.rate, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get exchange rate'
      };
    }
  }

  /**
   * Update exchange rate (admin only)
   */
  static async updateExchangeRate(
    adminId: string,
    fromCurrency: string,
    toCurrency: string,
    rate: number
  ): Promise<ServiceResponse<CurrencyExchangeRate>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update exchange rates' };
      }

      // Check if rate exists
      const { data: existingRate } = await supabase
        .from('currency_exchange_rates')
        .select('id')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .maybeSingle();

      let result;
      
      if (existingRate) {
        // Update existing rate
        result = await supabase
          .from('currency_exchange_rates')
          .update({
            rate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRate.id)
          .select()
          .single();
      } else {
        // Create new rate
        result = await supabase
          .from('currency_exchange_rates')
          .insert({
            from_currency: fromCurrency,
            to_currency: toCurrency,
            rate
          })
          .select()
          .single();
      }

      if (result.error) {
        return { data: null, error: result.error.message };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update exchange rate'
      };
    }
  }

  /**
   * Get payment gateway settings for a country
   */
  static async getPaymentGatewaySettings(
    countryCode?: string
  ): Promise<ServiceResponse<string[]>> {
    try {
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('category', 'payment_gateways')
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      if (!settings) {
        // Default to wallet and stripe if no settings found
        return { data: ['wallet', 'stripe'], error: null };
      }

      // If country code is provided, check for country-specific settings
      if (countryCode && settings.settings.country_gateways && 
          settings.settings.country_gateways[countryCode]) {
        return { 
          data: settings.settings.country_gateways[countryCode], 
          error: null 
        };
      }

      // Otherwise, return default gateways
      return { 
        data: settings.settings.default_gateways || ['wallet', 'stripe'], 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get payment gateway settings'
      };
    }
  }

  /**
   * Update payment gateway settings for a country (admin only)
   */
  static async updatePaymentGatewaySettings(
    adminId: string,
    countryCode: string,
    enabledGateways: string[]
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update payment gateway settings' };
      }

      // Get current settings
      const { data: settings } = await supabase
        .from('app_settings')
        .select('id, settings')
        .eq('category', 'payment_gateways')
        .maybeSingle();

      let newSettings: Record<string, any> = {
        default_gateways: ['wallet', 'stripe'],
        country_gateways: {}
      };

      if (settings) {
        newSettings = {
          ...settings.settings,
          country_gateways: {
            ...(settings.settings.country_gateways || {}),
            [countryCode]: enabledGateways
          }
        };
      } else {
        newSettings.country_gateways[countryCode] = enabledGateways;
      }

      // Update settings
      const result = await this.updateSettings(adminId, 'payment_gateways', newSettings);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment gateway settings'
      };
    }
  }

  /**
   * Get all supported currencies
   */
  static async getSupportedCurrencies(): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('currency_exchange_rates')
        .select('from_currency')
        .order('from_currency');

      if (error) {
        return { data: null, error: error.message };
      }

      // Extract unique currencies
      const currencies = [...new Set(data.map(item => item.from_currency))];
      
      return { data: currencies, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get supported currencies'
      };
    }
  }

  /**
   * Get all exchange rates
   */
  static async getAllExchangeRates(): Promise<ServiceResponse<CurrencyExchangeRate[]>> {
    try {
      const { data, error } = await supabase
        .from('currency_exchange_rates')
        .select('*')
        .order('from_currency, to_currency');

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get exchange rates'
      };
    }
  }

  /**
   * Get all country currency settings
   */
  static async getAllCountryCurrencySettings(): Promise<ServiceResponse<CountryCurrencySettings[]>> {
    try {
      const { data, error } = await supabase
        .from('country_currency_settings')
        .select('*')
        .order('country_code');

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get country currency settings'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getSettings,
  updateSettings,
  getAllSettings,
  getCountryCurrencySettings,
  updateCountryCurrencySettings,
  getExchangeRate,
  updateExchangeRate,
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
  getSupportedCurrencies,
  getAllExchangeRates,
  getAllCountryCurrencySettings
} = SettingsService;