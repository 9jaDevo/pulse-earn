import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Globe,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Edit
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { CountrySelect } from '../ui/CountrySelect';
import { Pagination } from '../ui/Pagination';

interface CommissionTier {
  id: string;
  name: string;
  min_referrals: number;
  global_rate: number;
  country_rates: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AmbassadorCommissionSettings: React.FC = () => {
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [showAddTier, setShowAddTier] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  
  // New tier form state
  const [newTier, setNewTier] = useState<{
    name: string;
    min_referrals: number;
    global_rate: number;
    country_rates: Record<string, number>;
  }>({
    name: '',
    min_referrals: 0,
    global_rate: 10.0,
    country_rates: {}
  });
  
  // Country rate form state
  const [newCountryRate, setNewCountryRate] = useState<{
    country: string;
    rate: number;
  }>({
    country: '',
    rate: 0
  });

  useEffect(() => {
    fetchCommissionTiers();
  }, [currentPage]);

  const fetchCommissionTiers = async () => {
    setLoading(true);
    try {
      // Calculate pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Fetch tiers with pagination
      const { data, error, count } = await supabase
        .from('ambassador_commission_tiers')
        .select('*', { count: 'exact' })
        .order('min_referrals', { ascending: true })
        .range(from, to);
      
      if (error) {
        throw error;
      }
      
      // Transform country_rates from JSONB to Record<string, number>
      const transformedTiers = (data || []).map(tier => ({
        ...tier,
        country_rates: tier.country_rates || {}
      }));
      
      setTiers(transformedTiers);
      setTotalItems(count || 0);
      
      // Initialize expanded state for new tiers
      const newExpandedState = { ...expandedTiers };
      transformedTiers.forEach(tier => {
        if (newExpandedState[tier.id] === undefined) {
          newExpandedState[tier.id] = false;
        }
      });
      setExpandedTiers(newExpandedState);
    } catch (err) {
      console.error('Error fetching commission tiers:', err);
      errorToast('Failed to load commission tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTier = async () => {
    if (!newTier.name.trim()) {
      errorToast('Tier name is required');
      return;
    }
    
    if (newTier.min_referrals < 0) {
      errorToast('Minimum referrals must be a positive number');
      return;
    }
    
    if (newTier.global_rate < 0 || newTier.global_rate > 100) {
      errorToast('Commission rate must be between 0 and 100');
      return;
    }
    
    setSaving(true);
    
    try {
      // Check if we're editing or creating
      if (editingTierId) {
        // Update existing tier
        const { error } = await supabase
          .from('ambassador_commission_tiers')
          .update({
            name: newTier.name,
            min_referrals: newTier.min_referrals,
            global_rate: newTier.global_rate,
            country_rates: newTier.country_rates,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTierId);
        
        if (error) {
          throw error;
        }
        
        successToast('Commission tier updated successfully');
      } else {
        // Create new tier
        const { error } = await supabase
          .from('ambassador_commission_tiers')
          .insert({
            name: newTier.name,
            min_referrals: newTier.min_referrals,
            global_rate: newTier.global_rate,
            country_rates: newTier.country_rates
          });
        
        if (error) {
          throw error;
        }
        
        successToast('Commission tier created successfully');
      }
      
      // Reset form and refresh data
      setNewTier({
        name: '',
        min_referrals: 0,
        global_rate: 10.0,
        country_rates: {}
      });
      setShowAddTier(false);
      setEditingTierId(null);
      fetchCommissionTiers();
    } catch (err) {
      console.error('Error saving commission tier:', err);
      errorToast('Failed to save commission tier');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this commission tier?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('ambassador_commission_tiers')
        .delete()
        .eq('id', tierId);
      
      if (error) {
        throw error;
      }
      
      successToast('Commission tier deleted successfully');
      fetchCommissionTiers();
    } catch (err) {
      console.error('Error deleting commission tier:', err);
      errorToast('Failed to delete commission tier');
    }
  };

  const handleToggleTierStatus = async (tier: CommissionTier) => {
    try {
      const { error } = await supabase
        .from('ambassador_commission_tiers')
        .update({
          is_active: !tier.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', tier.id);
      
      if (error) {
        throw error;
      }
      
      successToast(`Tier ${tier.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchCommissionTiers();
    } catch (err) {
      console.error('Error updating tier status:', err);
      errorToast('Failed to update tier status');
    }
  };

  const handleEditTier = (tier: CommissionTier) => {
    setNewTier({
      name: tier.name,
      min_referrals: tier.min_referrals,
      global_rate: tier.global_rate,
      country_rates: tier.country_rates
    });
    setEditingTierId(tier.id);
    setShowAddTier(true);
  };

  const handleAddCountryRate = () => {
    if (!newCountryRate.country) {
      errorToast('Please select a country');
      return;
    }
    
    if (newCountryRate.rate < 0 || newCountryRate.rate > 100) {
      errorToast('Commission rate must be between 0 and 100');
      return;
    }
    
    // Add country rate to the new tier
    setNewTier(prev => ({
      ...prev,
      country_rates: {
        ...prev.country_rates,
        [newCountryRate.country]: newCountryRate.rate
      }
    }));
    
    // Reset country rate form
    setNewCountryRate({
      country: '',
      rate: 0
    });
  };

  const handleRemoveCountryRate = (country: string) => {
    setNewTier(prev => {
      const updatedRates = { ...prev.country_rates };
      delete updatedRates[country];
      return {
        ...prev,
        country_rates: updatedRates
      };
    });
  };

  const handleToggleExpand = (tierId: string) => {
    setExpandedTiers(prev => ({
      ...prev,
      [tierId]: !prev[tierId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <DollarSign className="h-6 w-6 mr-3 text-primary-600" />
          Ambassador Commission Tiers
        </h2>
        <button
          onClick={() => {
            setNewTier({
              name: '',
              min_referrals: 0,
              global_rate: 10.0,
              country_rates: {}
            });
            setEditingTierId(null);
            setShowAddTier(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          disabled={showAddTier}
        >
          <Plus className="h-4 w-4" />
          <span>Add Tier</span>
        </button>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">About Commission Tiers</h3>
          <p className="text-blue-700 text-sm">
            Commission tiers determine the percentage that ambassadors earn from referrals. 
            Higher tiers offer better rates as ambassadors bring in more referrals. 
            You can also set country-specific rates for each tier.
          </p>
        </div>
      </div>
      
      {/* Add/Edit Tier Form */}
      {showAddTier && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTierId ? 'Edit Commission Tier' : 'Add Commission Tier'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tier Name *
              </label>
              <input
                type="text"
                value={newTier.name}
                onChange={(e) => setNewTier(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Bronze, Silver, Gold"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Referrals *
              </label>
              <input
                type="number"
                value={newTier.min_referrals}
                onChange={(e) => setNewTier(prev => ({ ...prev, min_referrals: parseInt(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Minimum referrals required"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum number of referrals required to reach this tier
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Global Commission Rate (%) *
              </label>
              <input
                type="number"
                value={newTier.global_rate}
                onChange={(e) => setNewTier(prev => ({ ...prev, global_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Default commission rate"
                min="0"
                max="100"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Default commission percentage for all countries
              </p>
            </div>
          </div>
          
          {/* Country-specific rates */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Country-Specific Rates (Optional)</h4>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <CountrySelect
                    value={newCountryRate.country}
                    onChange={(country) => setNewCountryRate(prev => ({ ...prev, country }))}
                    placeholder="Select country"
                    showFlag={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate (%)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newCountryRate.rate}
                      onChange={(e) => setNewCountryRate(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Commission rate"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={handleAddCountryRate}
                      className="bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Display country rates */}
            {Object.keys(newTier.country_rates).length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission Rate
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(newTier.country_rates).map(([country, rate]) => (
                      <tr key={country}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {/* Display country flag emoji if available */}
                              {country.length === 2 
                                ? String.fromCodePoint(...[...country.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
                                : '🌎'}
                            </span>
                            <span className="font-medium text-gray-900">{country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900">{rate}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveCountryRate(country)}
                            className="text-error-600 hover:text-error-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No country-specific rates added</p>
                <p className="text-sm text-gray-400">The global rate will apply to all countries</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setShowAddTier(false);
                setEditingTierId(null);
              }}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTier}
              disabled={saving || !newTier.name.trim()}
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
                  <span>{editingTierId ? 'Update Tier' : 'Create Tier'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Tiers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading commission tiers...</p>
        </div>
      ) : tiers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No commission tiers found</h3>
          <p className="text-gray-600 mb-6">
            Create your first commission tier to define how ambassadors earn from referrals
          </p>
          <button
            onClick={() => {
              setNewTier({
                name: '',
                min_referrals: 0,
                global_rate: 10.0,
                country_rates: {}
              });
              setEditingTierId(null);
              setShowAddTier(true);
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create First Tier
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`bg-white rounded-xl shadow-sm border ${
                tier.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      tier.is_active ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <DollarSign className={`h-6 w-6 ${
                        tier.is_active ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                      <p className="text-sm text-gray-500">
                        {tier.min_referrals}+ referrals • {tier.global_rate}% commission
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleExpand(tier.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      {expandedTiers[tier.id] ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditTier(tier)}
                      className="p-2 text-primary-600 hover:text-primary-800 rounded-full hover:bg-primary-50"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleTierStatus(tier)}
                      className={`p-2 rounded-full ${
                        tier.is_active 
                          ? 'text-error-600 hover:text-error-800 hover:bg-error-50' 
                          : 'text-success-600 hover:text-success-800 hover:bg-success-50'
                      }`}
                    >
                      {tier.is_active ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteTier(tier.id)}
                      className="p-2 text-error-600 hover:text-error-800 rounded-full hover:bg-error-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedTiers[tier.id] && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Country-Specific Rates</h4>
                    
                    {Object.keys(tier.country_rates).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Country
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Commission Rate
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Difference from Global
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(tier.country_rates).map(([country, rate]) => (
                              <tr key={country}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-lg mr-2">
                                      {/* Display country flag emoji if available */}
                                      {country.length === 2 
                                        ? String.fromCodePoint(...[...country.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
                                        : '🌎'}
                                    </span>
                                    <span className="font-medium text-gray-900">{country}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-gray-900">{rate}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {rate > tier.global_rate ? (
                                    <span className="text-success-600">+{(rate - tier.global_rate).toFixed(2)}%</span>
                                  ) : rate < tier.global_rate ? (
                                    <span className="text-error-600">-{(tier.global_rate - rate).toFixed(2)}%</span>
                                  ) : (
                                    <span className="text-gray-500">Same</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No country-specific rates</p>
                        <p className="text-sm text-gray-400">The global rate applies to all countries</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};