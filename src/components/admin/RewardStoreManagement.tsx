import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  RefreshCw, 
  Save,
  X,
  DollarSign,
  Package,
  ShoppingBag,
  Globe,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RewardService } from '../../services/rewardService';
import { SettingsService } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';
import type { RewardStoreItem } from '../../types/api';
import getSymbolFromCurrency from 'currency-symbol-map';

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item?: RewardStoreItem | null;
}

const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    item_type: string;
    points_cost: number;
    value: string;
    currency: string;
    image_url: string;
    fulfillment_instructions: string;
    is_active: boolean;
    stock_quantity: number | null;
  }>({
    name: '',
    description: '',
    item_type: 'gift_card',
    points_cost: 1000,
    value: '$10',
    currency: 'USD',
    image_url: '',
    fulfillment_instructions: '',
    is_active: true,
    stock_quantity: null
  });
  
  // Set form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        item_type: item.item_type,
        points_cost: item.points_cost,
        value: item.value || '',
        currency: item.currency || 'USD',
        image_url: item.image_url || '',
        fulfillment_instructions: item.fulfillment_instructions || '',
        is_active: item.is_active,
        stock_quantity: item.stock_quantity === undefined ? null : item.stock_quantity
      });
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        description: '',
        item_type: 'gift_card',
        points_cost: 1000,
        value: '$10',
        currency: 'USD',
        image_url: '',
        fulfillment_instructions: '',
        is_active: true,
        stock_quantity: null
      });
    }
  }, [item]);
  
  // Fetch supported currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const { data, error } = await SettingsService.getSupportedCurrencies();
        if (error) {
          console.error('Error fetching currencies:', error);
        } else {
          setSupportedCurrencies(data || ['USD']);
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    
    fetchCurrencies();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to perform this action');
      return;
    }
    
    // Validate form
    if (!formData.name.trim()) {
      errorToast('Item name is required');
      return;
    }
    
    if (formData.points_cost <= 0) {
      errorToast('Points cost must be greater than zero');
      return;
    }
    
    setLoading(true);
    
    try {
      if (item) {
        // Update existing item
        const { error } = await RewardService.updateRewardStoreItem(
          user.id,
          item.id,
          {
            name: formData.name,
            description: formData.description || undefined,
            item_type: formData.item_type,
            points_cost: formData.points_cost,
            value: formData.value || undefined,
            currency: formData.currency,
            image_url: formData.image_url || undefined,
            fulfillment_instructions: formData.fulfillment_instructions || undefined,
            is_active: formData.is_active,
            stock_quantity: formData.stock_quantity
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Item updated successfully');
      } else {
        // Create new item
        const { error } = await RewardService.createRewardStoreItem(
          user.id,
          {
            name: formData.name,
            description: formData.description || undefined,
            item_type: formData.item_type,
            points_cost: formData.points_cost,
            value: formData.value || undefined,
            currency: formData.currency,
            image_url: formData.image_url || undefined,
            fulfillment_instructions: formData.fulfillment_instructions || undefined,
            is_active: formData.is_active,
            stock_quantity: formData.stock_quantity
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Item created successfully');
      }
      
      onSave();
      onClose();
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Get currency symbol
  const currencySymbol = getSymbolFromCurrency(formData.currency) || '$';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Gift className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Edit Reward Item' : 'Add Reward Item'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter item name"
              required
            />
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide a description for this item"
              rows={3}
            />
          </div>

          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Type *
            </label>
            <select
              value={formData.item_type}
              onChange={(e) => setFormData(prev => ({ ...prev, item_type: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="gift_card">Gift Card</option>
              <option value="subscription_code">Subscription Code</option>
              <option value="paypal_payout">PayPal Payout</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="physical_item">Physical Item</option>
            </select>
          </div>
          
          {/* Points Cost and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points Cost *
              </label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_cost: parseInt(e.target.value) || 0 }))}
                  className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter points cost"
                  min="1"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Number of points required to redeem this item
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                  required
                >
                  {loadingCurrencies ? (
                    <option value="USD">Loading currencies...</option>
                  ) : (
                    supportedCurrencies.map(currency => (
                      <option key={currency} value={currency}>
                        {currency} {getSymbolFromCurrency(currency) || ''}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Currency in which the points cost is denominated
              </p>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={`${currencySymbol}10 Gift Card`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Displayed value of the item (e.g., "$10 Gift Card")
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/image.png"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL to an image representing this item
            </p>
          </div>

          {/* Fulfillment Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fulfillment Instructions (Optional)
            </label>
            <textarea
              value={formData.fulfillment_instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, fulfillment_instructions: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Instructions for redeeming or using this item"
              rows={3}
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity (Optional)
            </label>
            <input
              type="number"
              value={formData.stock_quantity === null ? '' : formData.stock_quantity}
              onChange={(e) => {
                const value = e.target.value === '' ? null : parseInt(e.target.value);
                setFormData(prev => ({ ...prev, stock_quantity: value }));
              }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Leave empty for unlimited stock"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of items available (leave empty for unlimited)
            </p>
          </div>

          {/* Active Status (only for editing) */}
          {item && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Item is active
              </label>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{item ? 'Update Item' : 'Create Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RewardStoreManagement: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [items, setItems] = useState<RewardStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RewardStoreItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    fetchItems();
    fetchSupportedCurrencies();
  }, [currentPage, selectedType, selectedCurrency]);
  
  const fetchItems = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate offset based on current page and items per page
      const offset = (currentPage - 1) * itemsPerPage;
      
      const options: any = {
        limit: itemsPerPage,
        offset: offset
      };
      
      if (selectedType !== 'all') {
        options.itemType = selectedType;
      }
      
      if (selectedCurrency !== 'all') {
        options.currency = selectedCurrency;
      }
      
      if (searchTerm) {
        // In a real implementation, you would have a search endpoint
        // For now, we'll just filter the results client-side
      }
      
      const { data, error: fetchError } = await RewardService.getRewardStoreItems(options);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      // Filter by search term if provided
      let filteredItems = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.name.toLowerCase().includes(term) || 
          (item.description && item.description.toLowerCase().includes(term))
        );
      }
      
      setItems(filteredItems);
      
      // For now, we'll just set a mock total count
      // In a real implementation, you would get this from the API
      setTotalItems(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reward store items');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSupportedCurrencies = async () => {
    setLoadingCurrencies(true);
    try {
      const { data, error } = await SettingsService.getSupportedCurrencies();
      if (error) {
        console.error('Error fetching currencies:', error);
      } else {
        setSupportedCurrencies(data || ['USD']);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
    } finally {
      setLoadingCurrencies(false);
    }
  };
  
  const handleSearch = () => {
    setCurrentPage(1);
    fetchItems();
  };
  
  const handleToggleStatus = async (item: RewardStoreItem) => {
    if (!user) return;
    
    try {
      const { error } = await RewardService.updateRewardStoreItem(
        user.id,
        item.id,
        { is_active: !item.is_active }
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      // Update the item in the list
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      ));
      
      successToast(`Item ${item.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      errorToast('Failed to update item status');
    }
  };
  
  const handleDelete = async (itemId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    try {
      // In a real implementation, you would have a delete endpoint
      // For now, we'll just remove it from the list
      setItems(prev => prev.filter(i => i.id !== itemId));
      
      successToast('Item deleted successfully');
    } catch (err) {
      errorToast('Failed to delete item');
    }
  };
  
  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'gift_card':
        return <Gift className="h-5 w-5 text-primary-600" />;
      case 'subscription_code':
        return <ShoppingBag className="h-5 w-5 text-secondary-600" />;
      case 'paypal_payout':
        return <DollarSign className="h-5 w-5 text-accent-600" />;
      case 'bank_transfer':
        return <DollarSign className="h-5 w-5 text-success-600" />;
      case 'physical_item':
        return <Package className="h-5 w-5 text-warning-600" />;
      default:
        return <Gift className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getItemTypeDisplay = (type: string) => {
    switch (type) {
      case 'gift_card':
        return 'Gift Card';
      case 'subscription_code':
        return 'Subscription';
      case 'paypal_payout':
        return 'PayPal';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'physical_item':
        return 'Physical Item';
      default:
        return type.replace('_', ' ');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Gift className="h-6 w-6 mr-3 text-primary-600" />
          Reward Store Management
        </h2>
        <button
          onClick={() => {
            setSelectedItem(null);
            setShowAddModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">About Reward Store Items</h3>
          <p className="text-blue-700 text-sm">
            Manage items that users can redeem with their points. You can add different types of items like gift cards, 
            subscriptions, or physical items. Each item can have its own currency, which will be converted to the user's 
            preferred currency when displayed in the store.
          </p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="gift_card">Gift Cards</option>
              <option value="subscription_code">Subscriptions</option>
              <option value="paypal_payout">PayPal Payouts</option>
              <option value="bank_transfer">Bank Transfers</option>
              <option value="physical_item">Physical Items</option>
            </select>
            
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Currencies</option>
              {loadingCurrencies ? (
                <option value="" disabled>Loading currencies...</option>
              ) : (
                supportedCurrencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency} {getSymbolFromCurrency(currency) || ''}
                  </option>
                ))
              )}
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSelectedCurrency('all');
                setCurrentPage(1);
                fetchItems();
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 md:w-auto w-full justify-center"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Failed to load reward store items</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reward store items...</p>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedType !== 'all' || selectedCurrency !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first reward store item using the button above.'}
          </p>
          <button
            onClick={() => {
              setSelectedItem(null);
              setShowAddModal(true);
            }}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add First Item
          </button>
        </div>
      )}
      
      {/* Items Table */}
      {!loading && items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-10 w-10 object-cover rounded" />
                          ) : (
                            item.item_type === 'gift_card' ? '🎁' : 
                            item.item_type === 'subscription_code' ? '📺' : 
                            item.item_type === 'paypal_payout' ? '💰' : 
                            item.item_type === 'bank_transfer' ? '🏦' : 
                            item.item_type === 'physical_item' ? '📦' : '🏆'
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.value}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getItemTypeIcon(item.item_type)}
                        <span className="ml-2">{getItemTypeDisplay(item.item_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.points_cost.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getSymbolFromCurrency(item.currency || 'USD') || '$'}</span>
                        <span className="text-sm font-medium">{item.currency || 'USD'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.stock_quantity === null ? (
                        <span className="text-sm text-gray-500">Unlimited</span>
                      ) : (
                        <span className={`text-sm font-medium ${
                          item.stock_quantity > 10 ? 'text-success-600' : 
                          item.stock_quantity > 0 ? 'text-warning-600' : 
                          'text-error-600'
                        }`}>
                          {item.stock_quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAddModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Edit Item"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                        title={item.is_active ? 'Deactivate Item' : 'Activate Item'}
                      >
                        {item.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-error-600 hover:text-error-900"
                        title="Delete Item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{items.length}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> items
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={items.length < itemsPerPage || items.length === 0}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <AddEditItemModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          onSave={fetchItems}
          item={selectedItem}
        />
      )}
    </div>
  );
};