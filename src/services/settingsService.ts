import { supabase } from '../lib/supabase';

export interface AppSettings {
  [key: string]: any;
}

export interface IntegrationSettings {
  stripePublicKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  adsenseClientId?: string;
  adsenseEnabled?: boolean;
  adsenseHeaderSlot?: string;
  adsenseFooterSlot?: string;
  adsenseSidebarSlot?: string;
  adsenseContentSlot?: string;
  adsenseMobileSlot?: string;
}

export interface PromotedPollSettings {
  default_cost_per_vote: number;
  minimum_budget: number;
  maximum_budget: number;
  points_to_usd_conversion: number;
}

export interface CurrencySettings {
  supported_currencies: string[];
  default_currency: string;
  exchange_rates: Record<string, number>;
}

export class SettingsService {
  static async getSettings(category: string): Promise<{ data: AppSettings | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('settings')
        .eq('category', category)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return { data: null, error: error.message };
      }

      return { data: data?.settings || null, error: null };
    } catch (err) {
      console.error('Settings service error:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async updateSettings(
    userId: string,
    category: string, 
    settings: AppSettings
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          category,
          settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category'
        });

      if (error) {
        console.error('Error updating settings:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Settings service error:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async getIntegrationSettings(): Promise<{ data: IntegrationSettings | null; error: string | null }> {
    return this.getSettings('integrations');
  }

  static async updateIntegrationSettings(
    userId: string,
    settings: IntegrationSettings
  ): Promise<{ error: string | null }> {
    return this.updateSettings(userId, 'integrations', settings);
  }

  static async getPromotedPollSettings(): Promise<{ data: PromotedPollSettings | null; error: string | null }> {
    const { data, error } = await this.getSettings('promoted_polls');
    
    if (error) {
      return { data: null, error };
    }

    // Return default values if no settings found
    const defaultSettings: PromotedPollSettings = {
      default_cost_per_vote: 0.05,
      minimum_budget: 10,
      maximum_budget: 1000,
      points_to_usd_conversion: 100
    };

    return { 
      data: data ? { ...defaultSettings, ...data } : defaultSettings, 
      error: null 
    };
  }

  static async updatePromotedPollSettings(
    userId: string,
    settings: PromotedPollSettings
  ): Promise<{ error: string | null }> {
    return this.updateSettings(userId, 'promoted_polls', settings);
  }

  static async getSupportedCurrencies(): Promise<{ data: string[] | null; error: string | null }> {
    try {
      // First try to get from settings
      const { data: currencySettings, error: settingsError } = await this.getSettings('currencies');
      
      if (!settingsError && currencySettings?.supported_currencies) {
        return { data: currencySettings.supported_currencies, error: null };
      }

      // Fallback: try to get unique currencies from country_currency_settings table
      const { data: countrySettings, error: countryError } = await supabase
        .from('country_currency_settings')
        .select('enabled_currencies, default_currency');

      if (countryError) {
        console.error('Error fetching country currency settings:', countryError);
        // Return default currencies as fallback
        return { data: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'], error: null };
      }

      // Extract unique currencies from all countries
      const allCurrencies = new Set<string>();
      
      if (countrySettings) {
        countrySettings.forEach(setting => {
          if (setting.enabled_currencies) {
            setting.enabled_currencies.forEach((currency: string) => allCurrencies.add(currency));
          }
          if (setting.default_currency) {
            allCurrencies.add(setting.default_currency);
          }
        });
      }

      // If no currencies found, return defaults
      if (allCurrencies.size === 0) {
        return { data: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'], error: null };
      }

      return { data: Array.from(allCurrencies).sort(), error: null };
    } catch (err) {
      console.error('Error fetching supported currencies:', err);
      // Return default currencies as fallback
      return { data: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'], error: null };
    }
  }

  static async updateSupportedCurrencies(
    userId: string,
    currencies: string[]
  ): Promise<{ error: string | null }> {
    return this.updateSettings(userId, 'currencies', { supported_currencies: currencies });
  }

  static async getExchangeRates(): Promise<{ data: Record<string, number> | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('currency_exchange_rates')
        .select('from_currency, to_currency, rate');

      if (error) {
        console.error('Error fetching exchange rates:', error);
        return { data: null, error: error.message };
      }

      // Convert to a nested object structure
      const rates: Record<string, number> = {};
      
      if (data) {
        data.forEach(rate => {
          const key = `${rate.from_currency}_${rate.to_currency}`;
          rates[key] = rate.rate;
        });
      }

      return { data: rates, error: null };
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async updateExchangeRate(
    userId: string,
    fromCurrency: string,
    toCurrency: string,
    rate: number
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('currency_exchange_rates')
        .upsert({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'from_currency,to_currency'
        });

      if (error) {
        console.error('Error updating exchange rate:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Error updating exchange rate:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async getCountryCurrencySettings(countryCode: string): Promise<{ 
    data: { enabled_currencies: string[]; default_currency: string } | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('country_currency_settings')
        .select('enabled_currencies, default_currency')
        .eq('country_code', countryCode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching country currency settings:', error);
        return { data: null, error: error.message };
      }

      // Return default if no specific settings found
      if (!data) {
        return { 
          data: { 
            enabled_currencies: ['USD'], 
            default_currency: 'USD' 
          }, 
          error: null 
        };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error fetching country currency settings:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  static async updateCountryCurrencySettings(
    userId: string,
    countryCode: string,
    enabledCurrencies: string[],
    defaultCurrency: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('country_currency_settings')
        .upsert({
          country_code: countryCode,
          enabled_currencies: enabledCurrencies,
          default_currency: defaultCurrency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'country_code'
        });

      if (error) {
        console.error('Error updating country currency settings:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Error updating country currency settings:', err);
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
}