import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Check, 
  X, 
  Package,
  ShoppingBag,
  DollarSign,
  Tag,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { RewardService } from '../../services/rewardService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import type { RewardStoreItem, RedeemedItem } from '../../types/api';
import { supabase } from '../../lib/supabase';

export const RewardStoreManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'redemptions'>('items');
  const [storeItems, setStoreItems] = useState<RewardStoreItem[]>([]);
  const [redemptions, setRedemptions] = useState<RedeemedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RewardStoreItem | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<RedeemedItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { successToast, errorToast } = useToast();

  // Pagination state
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const [redemptionsPage, setRedemptionsPage] = useState(1);
  const [redemptionsPerPage, setRedemptionsPerPage] = useState(10);
  const [totalRedemptions, setTotalRedemptions] = useState(0);

  // New item form state
  const [itemForm, setItemForm] = useState<Partial<RewardStoreItem>>({
    name: '',
    description: '',
    item_type: 'gift_card',
    points_cost: 1000,
    value: '',
    currency: 'USD',
    image_url: '🎁',
    fulfillment_instructions: '',
    is_active: true,
    stock_quantity: null
  });

  // Redemption update form state
  const [redemptionForm, setRedemptionForm] = useState({
    status: 'pending_fulfillment',
    fulfillmentDetails: {} as Record<string, any>
  });

  useEffect(() => {
    if (activeTab === 'items') {
      fetchStoreItems();
    } else {
      fetchRedemptions();
    }
  }, [activeTab, itemsPage, redemptionsPage, itemsPerPage, redemptionsPerPage]);

  const fetchStoreItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate offset based on current page and items per page
      const offset = (itemsPage - 1) * itemsPerPage;
      
      // Prepare filter options
      const options: any = {
        limit: itemsPerPage,
        offset: offset
      };
      
      if (itemTypeFilter !== 'all') {
        options.itemType = itemTypeFilter;
      }
      
      // Fetch items with pagination
      const { data, error: serviceError } = await RewardService.getRewardStoreItems(options);
      
      if (serviceError) {
        setError(serviceError);
        errorToast(serviceError);
      } else {
        setStoreItems(data || []);
        
        // Get total count for pagination
        const { count } = await supabase
          .from('reward_store_items')
          .select('*', { count: 'exact', head: true });
        
        setTotalItems(count || 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate offset based on current page and items per page
      const offset = (redemptionsPage - 1) * redemptionsPerPage;
      
      // Build query with pagination
      let query = supabase
        .from('redeemed_items')
        .select('*')
        .range(offset, offset + redemptionsPerPage - 1)
        .order('redeemed_at', { ascending: false });
      
      // Apply status filter if selected
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`item_name.ilike.%${searchTerm}%,item_id.ilike.%${searchTerm}%`);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        setError(fetchError.message);
        errorToast(fetchError.message);
      } else {
        setRedemptions(data || []);
        
        // Get total count for pagination
        let countQuery = supabase
          .from('redeemed_items')
          .select('*', { count: 'exact', head: true });
        
        if (statusFilter !== 'all') {
          countQuery = countQuery.eq('status', statusFilter);
        }
        
        if (searchTerm) {
          countQuery = countQuery.or(`item_name.ilike.%${searchTerm}%,item_id.ilike.%${searchTerm}%`);
        }
        
        const { count } = await countQuery;
        setTotalRedemptions(count || 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!itemForm.name || !itemForm.points_cost) {
      errorToast('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call the createRewardStoreItem service
      // For now, we'll simulate it with a direct database call
      const { data, error } = await supabase
        .from('reward_store_items')
        .insert({
          name: itemForm.name,
          description: itemForm.description,
          item_type: itemForm.item_type,
          points_cost: itemForm.points_cost,
          value: itemForm.value,
          currency: itemForm.currency,
          image_url: itemForm.image_url,
          fulfillment_instructions: itemForm.fulfillment_instructions,
          is_active: itemForm.is_active,
          stock_quantity: itemForm.stock_quantity
        })
        .select()
        .single();
      
      if (error) {
        errorToast(`Failed to create item: ${error.message}`);
      } else {
        successToast('Reward item created successfully!');
        fetchStoreItems(); // Refresh the list
        setShowItemModal(false);
        resetItemForm();
      }
    } catch (err) {
      errorToast('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !itemForm.name || !itemForm.points_cost) {
      errorToast('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call the updateRewardStoreItem service
      // For now, we'll simulate it with a direct database call
      const { data, error } = await supabase
        .from('reward_store_items')
        .update({
          name: itemForm.name,
          description: itemForm.description,
          item_type: itemForm.item_type,
          points_cost: itemForm.points_cost,
          value: itemForm.value,
          currency: itemForm.currency,
          image_url: itemForm.image_url,
          fulfillment_instructions: itemForm.fulfillment_instructions,
          is_active: itemForm.is_active,
          stock_quantity: itemForm.stock_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id)
        .select()
        .single();
      
      if (error) {
        errorToast(`Failed to update item: ${error.message}`);
      } else {
        successToast('Reward item updated successfully!');
        fetchStoreItems(); // Refresh the list
        setShowItemModal(false);
        setSelectedItem(null);
      }
    } catch (err) {
      errorToast('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRedemption = async () => {
    if (!selectedRedemption) {
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would call the updateRedemptionStatus service
      // For now, we'll simulate it with a direct database call
      const { data, error } = await supabase
        .from('redeemed_items')
        .update({
          status: redemptionForm.status,
          fulfillment_details: redemptionForm.fulfillmentDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRedemption.id)
        .select()
        .single();
      
      if (error) {
        errorToast(`Failed to update redemption: ${error.message}`);
      } else {
        successToast('Redemption updated successfully!');
        fetchRedemptions(); // Refresh the list
        setShowRedemptionModal(false);
        setSelectedRedemption(null);
      }
    } catch (err) {
      errorToast('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      item_type: 'gift_card',
      points_cost: 1000,
      value: '',
      currency: 'USD',
      image_url: '🎁',
      fulfillment_instructions: '',
      is_active: true,
      stock_quantity: null
    });
  };

  const handleEditItem = (item: RewardStoreItem) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      item_type: item.item_type,
      points_cost: item.points_cost,
      value: item.value,
      currency: item.currency,
      image_url: item.image_url,
      fulfillment_instructions: item.fulfillment_instructions,
      is_active: item.is_active,
      stock_quantity: item.stock_quantity
    });
    setShowItemModal(true);
  };

  const handleViewRedemption = (redemption: RedeemedItem) => {
    setSelectedRedemption(redemption);
    setRedemptionForm({
      status: redemption.status,
      fulfillmentDetails: redemption.fulfillment_details || {}
    });
    setShowRedemptionModal(true);
  };

  const getItemTypeDisplay = (type: string): string => {
    switch (type) {
      case 'gift_card': return 'Gift Card';
      case 'subscription_code': return 'Subscription';
      case 'paypal_payout': return 'PayPal';
      case 'bank_transfer': return 'Bank Transfer';
      case 'physical_item': return 'Physical Item';
      default: return type;
    }
  };

  const getStatusDisplay = (status: string): JSX.Element => {
    switch (status) {
      case 'pending_fulfillment':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
            <Check className="h-3 w-3 mr-1" />
            Fulfilled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Filter store items
  const filteredItems = storeItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = itemTypeFilter === 'all' || item.item_type === itemTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Filter redemptions
  const filteredRedemptions = redemptions.filter(redemption => {
    const matchesSearch = !searchTerm || 
      redemption.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redemption.item_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSearch = () => {
    // Reset to first page when searching
    if (activeTab === 'items') {
      setItemsPage(1);
      fetchStoreItems();
    } else {
      setRedemptionsPage(1);
      fetchRedemptions();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reward Store Management</h1>
        <p className="text-gray-600">Manage reward items and track redemptions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'items', label: 'Store Items', icon: Gift },
            { key: 'redemptions', label: 'Redemptions', icon: Package }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Store Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search items..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={itemTypeFilter}
                onChange={(e) => {
                  setItemTypeFilter(e.target.value);
                  setItemsPage(1); // Reset to first page when filter changes
                  setTimeout(() => fetchStoreItems(), 0);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="gift_card">Gift Cards</option>
                <option value="subscription_code">Subscriptions</option>
                <option value="paypal_payout">PayPal</option>
                <option value="bank_transfer">Bank Transfers</option>
                <option value="physical_item">Physical Items</option>
              </select>
              
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setItemsPage(1); // Reset to first page when items per page changes
                  setTimeout(() => fetchStoreItems(), 0);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              
              <button
                onClick={() => {
                  resetItemForm();
                  setSelectedItem(null);
                  setShowItemModal(true);
                }}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading store items...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Items Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{item.image_url || '🎁'}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-primary-100 text-primary-800">
                            {getItemTypeDisplay(item.item_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.points_cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.value} {item.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.stock_quantity === null ? 'Unlimited' : item.stock_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                            item.is_active ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this item?')) {
                                  try {
                                    const { error } = await supabase
                                      .from('reward_store_items')
                                      .delete()
                                      .eq('id', item.id);
                                    
                                    if (error) {
                                      errorToast(`Failed to delete item: ${error.message}`);
                                    } else {
                                      successToast('Item deleted successfully');
                                      fetchStoreItems(); // Refresh the list
                                    }
                                  } catch (err) {
                                    errorToast('An unexpected error occurred');
                                    console.error(err);
                                  }
                                }
                              }}
                              className="text-error-600 hover:text-error-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-600">
                    {searchTerm || itemTypeFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'Add your first reward item to get started.'}
                  </p>
                </div>
              )}
              
              {/* Pagination */}
              <Pagination
                currentPage={itemsPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setItemsPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Redemptions Tab */}
      {activeTab === 'redemptions' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search redemptions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setRedemptionsPage(1); // Reset to first page when filter changes
                  setTimeout(() => fetchRedemptions(), 0);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending_fulfillment">Pending</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={redemptionsPerPage}
                onChange={(e) => {
                  setRedemptionsPerPage(Number(e.target.value));
                  setRedemptionsPage(1); // Reset to first page when items per page changes
                  setTimeout(() => fetchRedemptions(), 0);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              
              <button
                onClick={fetchRedemptions}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading redemptions...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Redemptions Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Redeemed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRedemptions.map((redemption) => (
                      <tr key={redemption.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {redemption.fulfillment_details?.redeemedBy || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">{redemption.user_id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {redemption.item_id.includes('amazon') ? '🎁' : 
                               redemption.item_id.includes('netflix') ? '📺' : 
                               redemption.item_id.includes('spotify') ? '🎵' : 
                               redemption.item_id.includes('paypal') ? '💰' : 
                               redemption.item_id.includes('bank') ? '🏦' : 
                               redemption.item_id.includes('mouse') ? '🖱️' : 
                               redemption.item_id.includes('earbuds') ? '🎧' : 
                               redemption.item_id.includes('shirt') ? '👕' : '🏆'}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{redemption.item_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {redemption.points_cost.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusDisplay(redemption.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(redemption.redeemed_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewRedemption(redemption)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRedemptions.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No items have been redeemed yet.'}
                  </p>
                </div>
              )}
              
              {/* Pagination */}
              <Pagination
                currentPage={redemptionsPage}
                totalItems={totalRedemptions}
                itemsPerPage={redemptionsPerPage}
                onPageChange={setRedemptionsPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowItemModal(false);
                setSelectedItem(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedItem ? 'Edit Reward Item' : 'Create New Reward Item'}
            </h2>

            <div className="space-y-6">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter item name"
                  required
                />
              </div>

              {/* Item Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type *
                </label>
                <select
                  value={itemForm.item_type}
                  onChange={(e) => setItemForm(prev => ({ ...prev, item_type: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="gift_card">Gift Card</option>
                  <option value="subscription_code">Subscription</option>
                  <option value="paypal_payout">PayPal Payout</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="physical_item">Physical Item</option>
                </select>
              </div>

              {/* Points Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Cost *
                </label>
                <input
                  type="number"
                  value={itemForm.points_cost}
                  onChange={(e) => setItemForm(prev => ({ ...prev, points_cost: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter points cost"
                  min="1"
                  required
                />
              </div>

              {/* Value and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={itemForm.value}
                    onChange={(e) => setItemForm(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., $10, 1 month"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={itemForm.currency}
                    onChange={(e) => setItemForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., USD"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for non-monetary items</p>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image (Emoji)
                </label>
                <input
                  type="text"
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter emoji (e.g., 🎁)"
                />
                <p className="text-xs text-gray-500 mt-1">Use an emoji to represent this item</p>
              </div>

              {/* Fulfillment Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fulfillment Instructions
                </label>
                <textarea
                  value={itemForm.fulfillment_instructions}
                  onChange={(e) => setItemForm(prev => ({ ...prev, fulfillment_instructions: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Instructions for fulfillment"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Displayed to users after redemption</p>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={itemForm.stock_quantity === null ? '' : itemForm.stock_quantity}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value);
                    setItemForm(prev => ({ ...prev, stock_quantity: value }));
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Leave empty for unlimited"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited stock</p>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={itemForm.is_active}
                  onChange={(e) => setItemForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Item is active and available for redemption
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={selectedItem ? handleUpdateItem : handleCreateItem}
                  disabled={loading || !itemForm.name || !itemForm.points_cost}
                  className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : selectedItem ? (
                    'Update Item'
                  ) : (
                    'Create Item'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View/Update Redemption Modal */}
      {showRedemptionModal && selectedRedemption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowRedemptionModal(false);
                setSelectedRedemption(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Redemption Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Item</h3>
                <div className="flex items-center">
                  <div className="text-2xl mr-2">
                    {selectedRedemption.item_id.includes('amazon') ? '🎁' : 
                     selectedRedemption.item_id.includes('netflix') ? '📺' : 
                     selectedRedemption.item_id.includes('spotify') ? '🎵' : 
                     selectedRedemption.item_id.includes('paypal') ? '💰' : 
                     selectedRedemption.item_id.includes('bank') ? '🏦' : 
                     selectedRedemption.item_id.includes('mouse') ? '🖱️' : 
                     selectedRedemption.item_id.includes('earbuds') ? '🎧' : 
                     selectedRedemption.item_id.includes('shirt') ? '👕' : '🏆'}
                  </div>
                  <p className="text-gray-900 font-medium">{selectedRedemption.item_name}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Points Cost</h3>
                <p className="text-gray-900 font-medium">{selectedRedemption.points_cost.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">User</h3>
                <p className="text-gray-900 font-medium">
                  {selectedRedemption.fulfillment_details?.redeemedBy || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500">{selectedRedemption.user_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Redeemed On</h3>
                <p className="text-gray-900 font-medium">
                  {new Date(selectedRedemption.redeemed_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <select
                value={redemptionForm.status}
                onChange={(e) => setRedemptionForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pending_fulfillment">Pending Fulfillment</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Fulfillment Details</h3>
              
              {/* Different fields based on item type */}
              {selectedRedemption.item_id.includes('gift_card') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gift Card Code
                  </label>
                  <input
                    type="text"
                    value={redemptionForm.fulfillmentDetails.giftCardCode || ''}
                    onChange={(e) => setRedemptionForm(prev => ({
                      ...prev,
                      fulfillmentDetails: {
                        ...prev.fulfillmentDetails,
                        giftCardCode: e.target.value
                      }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter gift card code"
                  />
                </div>
              )}
              
              {selectedRedemption.item_id.includes('subscription') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Code
                  </label>
                  <input
                    type="text"
                    value={redemptionForm.fulfillmentDetails.subscriptionCode || ''}
                    onChange={(e) => setRedemptionForm(prev => ({
                      ...prev,
                      fulfillmentDetails: {
                        ...prev.fulfillmentDetails,
                        subscriptionCode: e.target.value
                      }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter subscription code"
                  />
                </div>
              )}
              
              {(selectedRedemption.item_id.includes('paypal') || selectedRedemption.item_id.includes('bank')) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={redemptionForm.fulfillmentDetails.transactionId || ''}
                    onChange={(e) => setRedemptionForm(prev => ({
                      ...prev,
                      fulfillmentDetails: {
                        ...prev.fulfillmentDetails,
                        transactionId: e.target.value
                      }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter transaction ID"
                  />
                </div>
              )}
              
              {selectedRedemption.item_id.includes('physical') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={redemptionForm.fulfillmentDetails.trackingNumber || ''}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        fulfillmentDetails: {
                          ...prev.fulfillmentDetails,
                          trackingNumber: e.target.value
                        }
                      }))}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Carrier
                    </label>
                    <input
                      type="text"
                      value={redemptionForm.fulfillmentDetails.shippingCarrier || ''}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        fulfillmentDetails: {
                          ...prev.fulfillmentDetails,
                          shippingCarrier: e.target.value
                        }
                      }))}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter shipping carrier"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={redemptionForm.fulfillmentDetails.notes || ''}
                  onChange={(e) => setRedemptionForm(prev => ({
                    ...prev,
                    fulfillmentDetails: {
                      ...prev.fulfillmentDetails,
                      notes: e.target.value
                    }
                  }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowRedemptionModal(false);
                  setSelectedRedemption(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRedemption}
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  'Update Redemption'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};