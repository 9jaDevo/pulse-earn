import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  DollarSign, 
  Save, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Edit,
  Check,
  X,
  Tv,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';
import { CountrySelect } from '../ui/CountrySelect';
import getSymbolFromCurrency from 'currency-symbol-map';

export const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'points' | 'integrations' | 'currency'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'PollPeak',
    platformDescription: 'Community-powered platform for polls, trivia, and rewards',
    defaultLanguage: 'en',
    defaultTheme: 'system',
    allowThemeSelection: true,
    logoUrl: '',
    faviconUrl: '',
    seoKeywords: '',
    ogImageUrl: '',
    marketingEnabled: true
  });
  
  // Points settings
  const [pointsSettings, setPointsSettings] = useState({
    pollVotePoints: 50,
    triviaEasyPoints: 10,
    triviaMediumPoints: 20,
    triviaHardPoints: 30,
    adWatchPoints: 15,
    referralBonusPoints: 100,
    maxStreakMultiplier: 2.0,
    streakIncrement: 0.1,
    points_to_usd_conversion: 100
  });
  
  // Integrations settings
  const [integrationsSettings, setIntegrationsSettings] = useState({
    adsenseEnabled: true,
    adsenseClientId: '',
    adsenseHeaderSlot: '',
    adsenseFooterSlot: '',
    adsenseSidebarSlot: '',
    adsenseContentSlot: '',
    adsenseMobileSlot: '',
    stripeEnabled: true,
    stripePublicKey: '',
    paystackEnabled: true
  });
  
  // Currency settings
  const [exchangeRates, setExchangeRates] = useState<Array<{
    id: string;
    from_currency: string;
    to_currency: string;
    rate: number;
    updated_at: string;
  }>>([]);
  
  const [countryCurrencySettings, setCountryCurrencySettings] = useState<Array<{
    id: string;
    country_code: string;
    country_name?: string;
    enabled_currencies: string[];
    default_currency: string;
    updated_at: string;
  }>>([]);
  
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [editingExchangeRate, setEditingExchangeRate] = useState<string | null>(null);
  const [editingCountrySetting, setEditingCountrySetting] = useState<string | null>(null);
  
  // New exchange rate form
  const [newExchangeRate, setNewExchangeRate] = useState({
    from_currency: 'USD',
    to_currency: 'EUR',
    rate: 0.85
  });
  
  // New country currency setting form
  const [newCountrySetting, setNewCountrySetting] = useState({
    country_code: '',
    enabled_currencies: ['USD'],
    default_currency: 'USD'
  });
  
  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all settings in parallel
      const [
        generalData,
        pointsData,
        integrationsData,
        exchangeRatesData,
        countryCurrencyData,
        supportedCurrenciesData
      ] = await Promise.all([
        SettingsService.getSettings('general'),
        SettingsService.getSettings('points'),
        SettingsService.getSettings('integrations'),
        SettingsService.getAllExchangeRates(),
        SettingsService.getAllCountryCurrencySettings(),
        SettingsService.getSupportedCurrencies()
      ]);
      
      // Update state with fetched data
      if (generalData.data) {
        setGeneralSettings({
          ...generalSettings,
          ...generalData.data
        });
      }
      
      if (pointsData.data) {
        setPointsSettings({
          ...pointsSettings,
          ...pointsData.data
        });
      }
      
      if (integrationsData.data) {
        setIntegrationsSettings({
          ...integrationsSettings,
          ...integrationsData.data
        });
      }
      
      if (exchangeRatesData.data) {
        setExchangeRates(exchangeRatesData.data || []);
      }
      
      if (countryCurrencyData.data) {
        // Add country names to the data
        const enhancedData = await Promise.all((countryCurrencyData.data || []).map(async (setting) => {
          // Get country name from code
          const countryName = setting.country_code;
          return {
            ...setting,
            country_name: countryName
          };
        }));
        
        setCountryCurrencySettings(enhancedData);
      }
      
      if (supportedCurrenciesData.data) {
        setSupportedCurrencies(supportedCurrenciesData.data || ['USD']);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      errorToast('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const saveGeneralSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const { error } = await SettingsService.updateSettings(
        user.id,
        'general',
        generalSettings
      );
      
      if (error) {
        throw new Error(error);
      }
      
      successToast('General settings saved successfully');
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to save general settings');
    } finally {
      setSaving(false);
    }
  };
  
  const savePointsSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const { error } = await SettingsService.updateSettings(
        user.id,
        'points',
        pointsSettings
      );
      
      if (error) {
        throw new Error(error);
      }
      
      successToast('Points settings saved successfully');
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to save points settings');
    } finally {
      setSaving(false);
    }
  };
  
  const saveIntegrationsSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const { error } = await SettingsService.updateSettings(
        user.id,
        'integrations',
        integrationsSettings
      );
      
      if (error) {
        throw new Error(error);
      }
      
      successToast('Integrations settings saved successfully');
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to save integrations settings');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddExchangeRate = async () => {
    if (!user) return;
    
    if (newExchangeRate.from_currency === newExchangeRate.to_currency) {
      errorToast('From and To currencies must be different');
      return;
    }
    
    if (newExchangeRate.rate <= 0) {
      errorToast('Exchange rate must be greater than zero');
      return;
    }
    
    setSaving(true);
    
    try {
      const { data, error } = await SettingsService.updateExchangeRate(
        user.id,
        newExchangeRate.from_currency,
        newExchangeRate.to_currency,
        newExchangeRate.rate
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (data) {
        // Check if this rate already exists in our list
        const existingIndex = exchangeRates.findIndex(
          rate => rate.from_currency === data.from_currency && rate.to_currency === data.to_currency
        );
        
        if (existingIndex >= 0) {
          // Update existing rate
          const updatedRates = [...exchangeRates];
          updatedRates[existingIndex] = data;
          setExchangeRates(updatedRates);
        } else {
          // Add new rate
          setExchangeRates([...exchangeRates, data]);
        }
        
        // Reset form
        setNewExchangeRate({
          from_currency: 'USD',
          to_currency: 'EUR',
          rate: 0.85
        });
        
        successToast('Exchange rate added successfully');
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to add exchange rate');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateExchangeRate = async (id: string, rate: number) => {
    if (!user) return;
    
    if (rate <= 0) {
      errorToast('Exchange rate must be greater than zero');
      return;
    }
    
    setSaving(true);
    
    try {
      const exchangeRate = exchangeRates.find(r => r.id === id);
      
      if (!exchangeRate) {
        throw new Error('Exchange rate not found');
      }
      
      const { data, error } = await SettingsService.updateExchangeRate(
        user.id,
        exchangeRate.from_currency,
        exchangeRate.to_currency,
        rate
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (data) {
        // Update the rate in our list
        const updatedRates = exchangeRates.map(r => 
          r.id === id ? data : r
        );
        
        setExchangeRates(updatedRates);
        setEditingExchangeRate(null);
        
        successToast('Exchange rate updated successfully');
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to update exchange rate');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddCountrySetting = async () => {
    if (!user) return;
    
    if (!newCountrySetting.country_code) {
      errorToast('Country is required');
      return;
    }
    
    if (newCountrySetting.enabled_currencies.length === 0) {
      errorToast('At least one currency must be enabled');
      return;
    }
    
    if (!newCountrySetting.enabled_currencies.includes(newCountrySetting.default_currency)) {
      errorToast('Default currency must be one of the enabled currencies');
      return;
    }
    
    setSaving(true);
    
    try {
      const { data, error } = await SettingsService.updateCountryCurrencySettings(
        user.id,
        newCountrySetting.country_code,
        newCountrySetting.enabled_currencies,
        newCountrySetting.default_currency
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (data) {
        // Check if this country already exists in our list
        const existingIndex = countryCurrencySettings.findIndex(
          setting => setting.country_code === data.country_code
        );
        
        if (existingIndex >= 0) {
          // Update existing setting
          const updatedSettings = [...countryCurrencySettings];
          updatedSettings[existingIndex] = {
            ...data,
            country_name: newCountrySetting.country_code
          };
          setCountryCurrencySettings(updatedSettings);
        } else {
          // Add new setting
          setCountryCurrencySettings([
            ...countryCurrencySettings, 
            {
              ...data,
              country_name: newCountrySetting.country_code
            }
          ]);
        }
        
        // Reset form
        setNewCountrySetting({
          country_code: '',
          enabled_currencies: ['USD'],
          default_currency: 'USD'
        });
        
        successToast('Country currency setting added successfully');
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to add country currency setting');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateCountrySetting = async (id: string, enabledCurrencies: string[], defaultCurrency: string) => {
    if (!user) return;
    
    if (enabledCurrencies.length === 0) {
      errorToast('At least one currency must be enabled');
      return;
    }
    
    if (!enabledCurrencies.includes(defaultCurrency)) {
      errorToast('Default currency must be one of the enabled currencies');
      return;
    }
    
    setSaving(true);
    
    try {
      const countrySetting = countryCurrencySettings.find(s => s.id === id);
      
      if (!countrySetting) {
        throw new Error('Country setting not found');
      }
      
      const { data, error } = await SettingsService.updateCountryCurrencySettings(
        user.id,
        countrySetting.country_code,
        enabledCurrencies,
        defaultCurrency
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (data) {
        // Update the setting in our list
        const updatedSettings = countryCurrencySettings.map(s => 
          s.id === id ? { ...data, country_name: s.country_name } : s
        );
        
        setCountryCurrencySettings(updatedSettings);
        setEditingCountrySetting(null);
        
        successToast('Country currency setting updated successfully');
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to update country currency setting');
    } finally {
      setSaving(false);
    }
  };
  
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Name
            </label>
            <input
              type="text"
              value={generalSettings.platformName}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformName: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter platform name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Language
            </label>
            <select
              value={generalSettings.defaultLanguage}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultLanguage: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Description
            </label>
            <textarea
              value={generalSettings.platformDescription}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformDescription: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter platform description"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Theme Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Theme
            </label>
            <select
              value={generalSettings.defaultTheme}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, defaultTheme: e.target.value as any }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Preference</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowThemeSelection"
              checked={generalSettings.allowThemeSelection}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowThemeSelection: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="allowThemeSelection" className="ml-2 block text-sm text-gray-900">
              Allow users to change theme
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO Settings</h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL
            </label>
            <input
              type="text"
              value={generalSettings.logoUrl}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon URL
            </label>
            <input
              type="text"
              value={generalSettings.faviconUrl}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, faviconUrl: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/favicon.ico"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Keywords
            </label>
            <input
              type="text"
              value={generalSettings.seoKeywords}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, seoKeywords: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="polls, trivia, rewards, community, earning, games"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Image URL
            </label>
            <input
              type="text"
              value={generalSettings.ogImageUrl}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, ogImageUrl: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/og-image.png"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Feature Toggles</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="marketingEnabled"
              checked={generalSettings.marketingEnabled}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, marketingEnabled: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="marketingEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Marketing Materials Module
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={saveGeneralSettings}
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {saving ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save General Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
  
  const renderPointsSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Points Rewards</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Vote Points
            </label>
            <input
              type="number"
              value={pointsSettings.pollVotePoints}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, pollVotePoints: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Points awarded for voting on a poll
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Watch Points
            </label>
            <input
              type="number"
              value={pointsSettings.adWatchPoints}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, adWatchPoints: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Points awarded for watching an ad
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trivia Easy Points
            </label>
            <input
              type="number"
              value={pointsSettings.triviaEasyPoints}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, triviaEasyPoints: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Points awarded for correct easy trivia answers
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trivia Medium Points
            </label>
            <input
              type="number"
              value={pointsSettings.triviaMediumPoints}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, triviaMediumPoints: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Points awarded for correct medium trivia answers
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trivia Hard Points
            </label>
            <input
              type="number"
              value={pointsSettings.triviaHardPoints}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, triviaHardPoints: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Points awarded for correct hard trivia answers
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Bonus Points
            </label>
            <input
              type="number"
              value={pointsSettings.referralBonusPoints}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, referralBonusPoints: parseInt(e.target.value) || 0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Points awarded for referring a new user
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Streak Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Streak Multiplier
            </label>
            <input
              type="number"
              value={pointsSettings.maxStreakMultiplier}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, maxStreakMultiplier: parseFloat(e.target.value) || 1.0 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="1.0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum multiplier for streaks (e.g., 2.0 = double points)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Streak Increment
            </label>
            <input
              type="number"
              value={pointsSettings.streakIncrement}
              onChange={(e) => setPointsSettings(prev => ({ ...prev, streakIncrement: parseFloat(e.target.value) || 0.1 }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0.01"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Increment per day for streak multiplier
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Currency Conversion</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points to USD Conversion Rate
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={pointsSettings.points_to_usd_conversion}
                onChange={(e) => setPointsSettings(prev => ({ ...prev, points_to_usd_conversion: parseInt(e.target.value) || 100 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="1"
              />
              <span className="ml-2 text-gray-700">points = $1 USD</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How many points equal one US dollar for wallet payments
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={savePointsSettings}
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {saving ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Points Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
  
  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Google AdSense</h3>
        
        <div className="flex items-center mb-6">
          <input
            type="checkbox"
            id="adsenseEnabled"
            checked={integrationsSettings.adsenseEnabled}
            onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseEnabled: e.target.checked }))}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="adsenseEnabled" className="ml-2 block text-sm text-gray-900">
            Enable Google AdSense
          </label>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AdSense Client ID
            </label>
            <div className="relative">
              <Tv className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={integrationsSettings.adsenseClientId}
                onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseClientId: e.target.value }))}
                className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ca-pub-xxxxxxxxxx"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your AdSense publisher ID
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Ad Slot
            </label>
            <input
              type="text"
              value={integrationsSettings.adsenseHeaderSlot}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseHeaderSlot: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="xxxxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Footer Ad Slot
            </label>
            <input
              type="text"
              value={integrationsSettings.adsenseFooterSlot}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseFooterSlot: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="xxxxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sidebar Ad Slot
            </label>
            <input
              type="text"
              value={integrationsSettings.adsenseSidebarSlot}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseSidebarSlot: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="xxxxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Ad Slot
            </label>
            <input
              type="text"
              value={integrationsSettings.adsenseContentSlot}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseContentSlot: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="xxxxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Ad Slot
            </label>
            <input
              type="text"
              value={integrationsSettings.adsenseMobileSlot}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, adsenseMobileSlot: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="xxxxxxxxxx"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Gateways</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="stripeEnabled"
              checked={integrationsSettings.stripeEnabled}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, stripeEnabled: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="stripeEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Stripe Payments
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="paystackEnabled"
              checked={integrationsSettings.paystackEnabled}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, paystackEnabled: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="paystackEnabled" className="ml-2 block text-sm text-gray-900">
              Enable Paystack Payments
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stripe Public Key
            </label>
            <input
              type="text"
              value={integrationsSettings.stripePublicKey}
              onChange={(e) => setIntegrationsSettings(prev => ({ ...prev, stripePublicKey: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="pk_test_xxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Stripe publishable key (starts with pk_)
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={saveIntegrationsSettings}
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {saving ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Integration Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
  
  const renderCurrencySettings = () => (
    <div className="space-y-6">
      {/* Exchange Rates */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Exchange Rates</h3>
          <button
            onClick={() => fetchSettings()}
            className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">About Exchange Rates</h4>
            <p className="text-blue-700 text-sm">
              Exchange rates are used to convert between currencies for payments, payouts, and reward store items.
              Make sure to keep these rates updated to reflect current market values.
            </p>
          </div>
        </div>
        
        {/* Add New Exchange Rate */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Add New Exchange Rate</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Currency
              </label>
              <select
                value={newExchangeRate.from_currency}
                onChange={(e) => setNewExchangeRate(prev => ({ ...prev, from_currency: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {supportedCurrencies.map(currency => (
                  <option key={`from-${currency}`} value={currency}>
                    {currency} {getSymbolFromCurrency(currency) || ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Currency
              </label>
              <select
                value={newExchangeRate.to_currency}
                onChange={(e) => setNewExchangeRate(prev => ({ ...prev, to_currency: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {supportedCurrencies.map(currency => (
                  <option key={`to-${currency}`} value={currency}>
                    {currency} {getSymbolFromCurrency(currency) || ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exchange Rate
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={newExchangeRate.rate}
                  onChange={(e) => setNewExchangeRate(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0.000001"
                  step="0.000001"
                />
                <button
                  onClick={handleAddExchangeRate}
                  disabled={saving}
                  className="ml-2 bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Exchange Rates Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exchangeRates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No exchange rates found. Add one above.
                  </td>
                </tr>
              ) : (
                exchangeRates.map(rate => (
                  <tr key={rate.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getSymbolFromCurrency(rate.from_currency) || ''}</span>
                        <span className="font-medium">{rate.from_currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getSymbolFromCurrency(rate.to_currency) || ''}</span>
                        <span className="font-medium">{rate.to_currency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingExchangeRate === rate.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={rate.rate}
                            onChange={(e) => {
                              const newRate = parseFloat(e.target.value) || 0;
                              setExchangeRates(prev => 
                                prev.map(r => r.id === rate.id ? { ...r, rate: newRate } : r)
                              );
                            }}
                            className="w-24 p-1 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0.000001"
                            step="0.000001"
                          />
                          <button
                            onClick={() => handleUpdateExchangeRate(rate.id, rate.rate)}
                            className="text-success-600 hover:text-success-800"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingExchangeRate(null)}
                            className="text-error-600 hover:text-error-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span>{rate.rate.toFixed(6)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rate.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingExchangeRate(rate.id)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Country Currency Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Country Currency Settings</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">About Country Currency Settings</h4>
            <p className="text-blue-700 text-sm">
              Define which currencies are available for users in specific countries and set the default currency for each country.
              If a country is not listed, users will see USD as the default currency.
            </p>
          </div>
        </div>
        
        {/* Add New Country Setting */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Add New Country Setting</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <CountrySelect
                value={newCountrySetting.country_code}
                onChange={(country) => setNewCountrySetting(prev => ({ ...prev, country_code: country }))}
                placeholder="Select country"
                showFlag={true}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={newCountrySetting.default_currency}
                onChange={(e) => setNewCountrySetting(prev => ({ ...prev, default_currency: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {supportedCurrencies.map(currency => (
                  <option key={`default-${currency}`} value={currency}>
                    {currency} {getSymbolFromCurrency(currency) || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enabled Currencies
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {supportedCurrencies.map(currency => (
                <label key={`enabled-${currency}`} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newCountrySetting.enabled_currencies.includes(currency)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewCountrySetting(prev => ({
                          ...prev,
                          enabled_currencies: [...prev.enabled_currencies, currency]
                        }));
                      } else {
                        // Don't allow removing the default currency
                        if (currency === newCountrySetting.default_currency) {
                          errorToast('Cannot remove the default currency');
                          return;
                        }
                        
                        setNewCountrySetting(prev => ({
                          ...prev,
                          enabled_currencies: prev.enabled_currencies.filter(c => c !== currency)
                        }));
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {currency} {getSymbolFromCurrency(currency) || ''}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAddCountrySetting}
              disabled={saving || !newCountrySetting.country_code}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Country Setting</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Country Settings Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enabled Currencies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {countryCurrencySettings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No country currency settings found. Add one above.
                  </td>
                </tr>
              ) : (
                countryCurrencySettings.map(setting => (
                  <tr key={setting.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {setting.country_code.length === 2 
                            ? String.fromCodePoint(...[...setting.country_code.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
                            : '🌎'}
                        </span>
                        <span className="font-medium">{setting.country_name || setting.country_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCountrySetting === setting.id ? (
                        <select
                          value={setting.default_currency}
                          onChange={(e) => {
                            const newDefault = e.target.value;
                            // Ensure the default currency is in the enabled currencies
                            let newEnabled = [...setting.enabled_currencies];
                            if (!newEnabled.includes(newDefault)) {
                              newEnabled.push(newDefault);
                            }
                            
                            setCountryCurrencySettings(prev => 
                              prev.map(s => s.id === setting.id ? { 
                                ...s, 
                                default_currency: newDefault,
                                enabled_currencies: newEnabled
                              } : s)
                            );
                          }}
                          className="w-full p-1 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {supportedCurrencies.map(currency => (
                            <option key={`edit-default-${currency}`} value={currency}>
                              {currency} {getSymbolFromCurrency(currency) || ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getSymbolFromCurrency(setting.default_currency) || ''}</span>
                          <span>{setting.default_currency}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCountrySetting === setting.id ? (
                        <div className="flex flex-wrap gap-2">
                          {supportedCurrencies.map(currency => (
                            <label key={`edit-enabled-${currency}`} className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={setting.enabled_currencies.includes(currency)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCountryCurrencySettings(prev => 
                                      prev.map(s => s.id === setting.id ? { 
                                        ...s, 
                                        enabled_currencies: [...s.enabled_currencies, currency]
                                      } : s)
                                    );
                                  } else {
                                    // Don't allow removing the default currency
                                    if (currency === setting.default_currency) {
                                      errorToast('Cannot remove the default currency');
                                      return;
                                    }
                                    
                                    setCountryCurrencySettings(prev => 
                                      prev.map(s => s.id === setting.id ? { 
                                        ...s, 
                                        enabled_currencies: s.enabled_currencies.filter(c => c !== currency)
                                      } : s)
                                    );
                                  }
                                }}
                                className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <span className="text-xs">{currency}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {setting.enabled_currencies.map(currency => (
                            <span 
                              key={`enabled-${currency}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {currency} {getSymbolFromCurrency(currency) || ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(setting.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingCountrySetting === setting.id ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleUpdateCountrySetting(
                              setting.id, 
                              setting.enabled_currencies,
                              setting.default_currency
                            )}
                            className="text-success-600 hover:text-success-800"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingCountrySetting(null)}
                            className="text-error-600 hover:text-error-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingCountrySetting(setting.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Settings className="h-6 w-6 mr-3 text-primary-600" />
          System Settings
        </h2>
        <button
          onClick={fetchSettings}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Settings</span>
        </button>
      </div>
      
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading settings</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('points')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'points'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Points</span>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'integrations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tv className="h-4 w-4" />
            <span>Integrations</span>
          </button>
          <button
            onClick={() => setActiveTab('currency')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'currency'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Currency</span>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'general' && renderGeneralSettings()}
      {activeTab === 'points' && renderPointsSettings()}
      {activeTab === 'integrations' && renderIntegrationsSettings()}
      {activeTab === 'currency' && renderCurrencySettings()}
    </div>
  );
};