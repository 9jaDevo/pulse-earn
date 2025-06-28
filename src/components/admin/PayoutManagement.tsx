import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  AlertCircle,
  Info,
  FileText,
  CreditCard,
  Send,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PayoutService } from '../../services/payoutService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import { format } from 'date-fns';
import { downloadCSV } from '../../utils/exportData';

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  payout_method: string;
  payout_details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  transaction_id?: string;
  user?: {
    name: string;
    email: string;
  };
  processor?: {
    name: string;
    email: string;
  };
}

interface PayoutMethod {
  id: string;
  name: string;
  description?: string;
  is_automatic: boolean;
  is_active: boolean;
  config: Record<string, any>;
}

interface PayoutDetailModalProps {
  request: PayoutRequest;
  onClose: () => void;
  onUpdateStatus: (status: 'approved' | 'rejected' | 'processed', notes?: string, transactionId?: string) => Promise<void>;
}

const PayoutDetailModal: React.FC<PayoutDetailModalProps> = ({ 
  request, 
  onClose, 
  onUpdateStatus 
}) => {
  const [notes, setNotes] = useState(request.admin_notes || '');
  const [transactionId, setTransactionId] = useState(request.transaction_id || '');
  const [loading, setLoading] = useState(false);
  
  const handleUpdateStatus = async (status: 'approved' | 'rejected' | 'processed') => {
    setLoading(true);
    await onUpdateStatus(status, notes, status === 'processed' ? transactionId : undefined);
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payout Request Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Request ID</h3>
            <p className="text-gray-900">{request.id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              request.status === 'pending' ? 'bg-warning-100 text-warning-700' :
              request.status === 'approved' ? 'bg-primary-100 text-primary-700' :
              request.status === 'processed' ? 'bg-success-100 text-success-700' :
              'bg-error-100 text-error-700'
            }`}>
              {request.status}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
            <p className="text-xl font-bold text-gray-900">${request.amount.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Payout Method</h3>
            <p className="text-gray-900">{request.payout_method}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Requested By</h3>
            <p className="text-gray-900">{request.user?.name || 'Unknown'}</p>
            <p className="text-sm text-gray-500">{request.user?.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Requested On</h3>
            <p className="text-gray-900">{new Date(request.requested_at).toLocaleString()}</p>
          </div>
          {request.processed_at && (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Processed By</h3>
                <p className="text-gray-900">{request.processor?.name || 'Unknown'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Processed On</h3>
                <p className="text-gray-900">{new Date(request.processed_at).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Payout Details</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {request.payout_method === 'PayPal' && (
              <div className="mb-2">
                <span className="font-medium">PayPal Email:</span> {request.payout_details.paypal_email}
              </div>
            )}
            
            {request.payout_method === 'Bank Transfer' && request.payout_details.bank_details && (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Account Name:</span> {request.payout_details.bank_details.account_name}
                </div>
                <div>
                  <span className="font-medium">Account Number:</span> {request.payout_details.bank_details.account_number}
                </div>
                <div>
                  <span className="font-medium">Bank Name:</span> {request.payout_details.bank_details.bank_name}
                </div>
                {request.payout_details.bank_details.swift_code && (
                  <div>
                    <span className="font-medium">SWIFT/BIC:</span> {request.payout_details.bank_details.swift_code}
                  </div>
                )}
                {request.payout_details.bank_details.routing_number && (
                  <div>
                    <span className="font-medium">Routing Number:</span> {request.payout_details.bank_details.routing_number}
                  </div>
                )}
              </div>
            )}
            
            {request.payout_details.user_country && (
              <div className="mt-2">
                <span className="font-medium">Country:</span> {request.payout_details.user_country}
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Admin Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add notes about this payout request..."
            rows={3}
          />
        </div>
        
        {(request.status === 'pending' || request.status === 'approved') && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter transaction ID when processed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required when marking a payout as processed
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
          {request.status === 'pending' && (
            <>
              <button
                onClick={() => handleUpdateStatus('approved')}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              
              <button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={loading}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          
          {(request.status === 'pending' || request.status === 'approved') && (
            <button
              onClick={() => handleUpdateStatus('processed')}
              disabled={loading || !transactionId.trim()}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
            >
              Mark as Processed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface PayoutMethodModalProps {
  method?: PayoutMethod | null;
  onClose: () => void;
  onSave: () => void;
}

const PayoutMethodModal: React.FC<PayoutMethodModalProps> = ({ 
  method, 
  onClose, 
  onSave 
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    is_automatic: boolean;
    is_active: boolean;
    min_payout: number;
    fee_percentage: number;
    fee_fixed: number;
    processing_days: number;
    requires_email: boolean;
    requires_bank_details: boolean;
    requires_admin_approval: boolean;
  }>({
    name: '',
    description: '',
    is_automatic: false,
    is_active: true,
    min_payout: 10,
    fee_percentage: 0,
    fee_fixed: 0,
    processing_days: 1,
    requires_email: false,
    requires_bank_details: false,
    requires_admin_approval: false
  });
  
  // Initialize form data from method
  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name,
        description: method.description || '',
        is_automatic: method.is_automatic,
        is_active: method.is_active,
        min_payout: method.config?.min_payout || 10,
        fee_percentage: method.config?.fee_percentage || 0,
        fee_fixed: method.config?.fee_fixed || 0,
        processing_days: method.config?.processing_days || 1,
        requires_email: method.config?.requires_email || false,
        requires_bank_details: method.config?.requires_bank_details || false,
        requires_admin_approval: method.config?.requires_admin_approval || false
      });
    }
  }, [method]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to perform this action');
      return;
    }
    
    if (!formData.name.trim()) {
      errorToast('Method name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare config object
      const config = {
        min_payout: formData.min_payout,
        fee_percentage: formData.fee_percentage,
        fee_fixed: formData.fee_fixed,
        processing_days: formData.processing_days,
        requires_email: formData.requires_email,
        requires_bank_details: formData.requires_bank_details,
        requires_admin_approval: formData.requires_admin_approval
      };
      
      if (method) {
        // Update existing method
        const { error } = await PayoutService.updatePayoutMethod(
          user.id,
          method.id,
          {
            name: formData.name,
            description: formData.description,
            is_automatic: formData.is_automatic,
            is_active: formData.is_active,
            config
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Payout method updated successfully');
      } else {
        // Create new method
        const { error } = await PayoutService.createPayoutMethod(
          user.id,
          {
            name: formData.name,
            description: formData.description,
            is_automatic: formData.is_automatic,
            config
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Payout method created successfully');
      }
      
      onSave();
      onClose();
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to save payout method');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {method ? 'Edit Payout Method' : 'Add Payout Method'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., PayPal, Bank Transfer"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe this payout method"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Payout Amount ($)
              </label>
              <input
                type="number"
                value={formData.min_payout}
                onChange={(e) => setFormData(prev => ({ ...prev, min_payout: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Minimum amount"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Days
              </label>
              <input
                type="number"
                value={formData.processing_days}
                onChange={(e) => setFormData(prev => ({ ...prev, processing_days: parseInt(e.target.value) || 1 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Days to process"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fee Percentage (%)
              </label>
              <input
                type="number"
                value={formData.fee_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, fee_percentage: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Fee percentage"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Fee ($)
              </label>
              <input
                type="number"
                value={formData.fee_fixed}
                onChange={(e) => setFormData(prev => ({ ...prev, fee_fixed: parseFloat(e.target.value) || 0 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Fixed fee amount"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_email"
                checked={formData.requires_email}
                onChange={(e) => setFormData(prev => ({ ...prev, requires_email: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_email" className="ml-2 block text-sm text-gray-900">
                Requires email address
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_bank_details"
                checked={formData.requires_bank_details}
                onChange={(e) => setFormData(prev => ({ ...prev, requires_bank_details: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_bank_details" className="ml-2 block text-sm text-gray-900">
                Requires bank details
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_admin_approval"
                checked={formData.requires_admin_approval}
                onChange={(e) => setFormData(prev => ({ ...prev, requires_admin_approval: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_admin_approval" className="ml-2 block text-sm text-gray-900">
                Requires admin approval
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_automatic"
                checked={formData.is_automatic}
                onChange={(e) => setFormData(prev => ({ ...prev, is_automatic: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_automatic" className="ml-2 block text-sm text-gray-900">
                Automatic processing
              </label>
            </div>
            
            {method && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Method is active
                </label>
              </div>
            )}
          </div>
          
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
              disabled={loading || !formData.name.trim()}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : method ? 'Update Method' : 'Create Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PayoutManagement: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'methods' | 'stats'>('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payout requests state
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [requestsPerPage] = useState(10);
  
  // Payout methods state
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  
  // Payout stats state
  const [payoutStats, setPayoutStats] = useState<any>(null);
  
  // Date filter state
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchPayoutRequests();
    } else if (activeTab === 'methods') {
      fetchPayoutMethods();
    } else if (activeTab === 'stats') {
      fetchPayoutStats();
    }
  }, [activeTab, statusFilter, currentPage]);
  
  const fetchPayoutRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await PayoutService.getAllPayoutRequests(
        user.id,
        {
          status: statusFilter === 'all' ? undefined : statusFilter as any,
          limit: requestsPerPage,
          offset: (currentPage - 1) * requestsPerPage
        }
      );
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setPayoutRequests(data?.requests || []);
      setTotalRequests(data?.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPayoutMethods = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await PayoutService.getPayoutMethods({
        activeOnly: false
      });
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setPayoutMethods(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout methods');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPayoutStats = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await PayoutService.getPayoutStats(user.id);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setPayoutStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout statistics');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateRequestStatus = async (
    requestId: string, 
    status: 'approved' | 'rejected' | 'processed', 
    notes?: string,
    transactionId?: string
  ) => {
    if (!user) {
      errorToast('You must be logged in to perform this action');
      return;
    }
    
    try {
      const { error } = await PayoutService.updatePayoutRequestStatus(
        user.id,
        requestId,
        {
          status,
          admin_notes: notes,
          transaction_id: transactionId
        }
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast(`Payout request ${status} successfully`);
      setSelectedRequest(null);
      fetchPayoutRequests();
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to update payout request');
    }
  };
  
  const exportPayoutRequests = () => {
    if (!payoutRequests.length) {
      errorToast('No data to export');
      return;
    }
    
    const data = payoutRequests.map(request => ({
      ID: request.id,
      User: request.user?.name || 'Unknown',
      Email: request.user?.email || 'Unknown',
      Amount: `$${request.amount.toFixed(2)}`,
      Method: request.payout_method,
      Status: request.status,
      RequestedAt: new Date(request.requested_at).toLocaleString(),
      ProcessedAt: request.processed_at ? new Date(request.processed_at).toLocaleString() : 'N/A',
      TransactionID: request.transaction_id || 'N/A',
      Notes: request.admin_notes || ''
    }));
    
    const filename = `payout-requests-${statusFilter}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(data, filename);
    successToast(`Exported ${data.length} payout requests to ${filename}`);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'approved':
        return 'bg-primary-100 text-primary-700';
      case 'processed':
        return 'bg-success-100 text-success-700';
      case 'rejected':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Payout Requests</h2>
        <div className="flex space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processed">Processed</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={requestsPerPage}
            onChange={(e) => {
              setCurrentPage(1); // Reset to first page when items per page changes
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
          
          <button
            onClick={fetchPayoutRequests}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportPayoutRequests}
            disabled={payoutRequests.length === 0}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payout requests...</p>
        </div>
      ) : error ? (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : payoutRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payout requests found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' 
              ? `There are no ${statusFilter} payout requests at this time.`
              : 'No payout requests have been made yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.user?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{request.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">${request.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.payout_method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalRequests}
            itemsPerPage={requestsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
  
  const renderMethods = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Payout Methods</h2>
        <button
          onClick={() => {
            setSelectedMethod(null);
            setShowMethodModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Method</span>
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payout methods...</p>
        </div>
      ) : error ? (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : payoutMethods.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payout methods found</h3>
          <p className="text-gray-600">
            Add your first payout method to enable ambassador payouts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payoutMethods.map((method) => (
            <div 
              key={method.id} 
              className={`bg-white rounded-xl p-6 shadow-sm border ${
                method.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  method.is_active ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`h-6 w-6 ${
                    method.is_active ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMethod(method);
                      setShowMethodModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{method.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Min. Payout:</span>
                  <span className="font-medium">${method.config?.min_payout || 0}</span>
                </div>
                
                {method.config?.fee_percentage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee:</span>
                    <span className="font-medium">{method.config.fee_percentage}%</span>
                  </div>
                )}
                
                {method.config?.fee_fixed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fixed Fee:</span>
                    <span className="font-medium">${method.config.fee_fixed}</span>
                  </div>
                )}
                
                {method.config?.processing_days > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processing Time:</span>
                    <span className="font-medium">{method.config.processing_days} days</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium ${method.is_active ? 'text-success-600' : 'text-gray-500'}`}>
                    {method.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Automatic:</span>
                  <span className="font-medium">
                    {method.is_automatic ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const renderStats = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Payout Statistics</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPayoutStats}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payout statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : !payoutStats ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No statistics available</h3>
          <p className="text-gray-600">
            Statistics will be available once payouts have been processed.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Processed Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">{payoutStats.totalProcessed}</p>
                </div>
                <div className="bg-success-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">{payoutStats.totalPending}</p>
                </div>
                <div className="bg-warning-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">${payoutStats.totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${payoutStats.pendingAmount.toFixed(2)}</p>
                </div>
                <div className="bg-warning-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Payout Amount</span>
                  <span className="text-xl font-bold text-gray-900">${payoutStats.averageAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Processing Time</span>
                  <span className="text-xl font-bold text-gray-900">{payoutStats.processingTime.toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Approval Rate</span>
                  <span className="text-xl font-bold text-gray-900">
                    {payoutStats.totalProcessed > 0 
                      ? `${((payoutStats.totalProcessed / (payoutStats.totalProcessed + payoutStats.totalPending)) * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm">
                    Review payout requests promptly to maintain ambassador satisfaction.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm">
                    Always include a transaction ID when marking a payout as processed.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm">
                    For bank transfers, verify account details carefully before processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payout Management</h1>
        <p className="text-gray-600">Manage ambassador payouts, methods, and track payment history</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'requests', label: 'Payout Requests', icon: DollarSign },
            { key: 'methods', label: 'Payout Methods', icon: CreditCard },
            { key: 'stats', label: 'Statistics', icon: FileText }
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
      
      {/* Content */}
      {activeTab === 'requests' && renderRequests()}
      {activeTab === 'methods' && renderMethods()}
      {activeTab === 'stats' && renderStats()}
      
      {/* Payout Detail Modal */}
      {selectedRequest && (
        <PayoutDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={async (status, notes, transactionId) => {
            await handleUpdateRequestStatus(selectedRequest.id, status, notes, transactionId);
          }}
        />
      )}
      
      {/* Payout Method Modal */}
      {showMethodModal && (
        <PayoutMethodModal
          method={selectedMethod}
          onClose={() => {
            setShowMethodModal(false);
            setSelectedMethod(null);
          }}
          onSave={() => {
            fetchPayoutMethods();
          }}
        />
      )}
    </div>
  );
};