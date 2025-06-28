import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, DollarSign, Eye, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PayoutService } from '../../services/payoutService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import { format } from 'date-fns';
import { downloadCSV } from '../../utils/exportData';

interface PayoutHistoryTableProps {
  limit?: number;
}

export const PayoutHistoryTable: React.FC<PayoutHistoryTableProps> = ({ limit = 5 }) => {
  const { user } = useAuth();
  const { errorToast, successToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  useEffect(() => {
    fetchPayoutHistory();
  }, [currentPage, limit]);
  
  const fetchPayoutHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await PayoutService.getUserPayoutRequests(user.id, {
        limit,
        offset: (currentPage - 1) * limit
      });
      
      if (error) {
        throw new Error(error);
      }
      
      setPayouts(data?.requests || []);
      setTotalPayouts(data?.totalCount || 0);
    } catch (err) {
      errorToast('Failed to load payout history');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'processed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const exportPayoutHistory = () => {
    if (!payouts.length) {
      errorToast('No data to export');
      return;
    }
    
    const data = payouts.map(payout => ({
      ID: payout.id,
      Amount: `$${payout.amount.toFixed(2)}`,
      Method: payout.payout_method,
      Status: payout.status,
      RequestedAt: new Date(payout.requested_at).toLocaleString(),
      ProcessedAt: payout.processed_at ? new Date(payout.processed_at).toLocaleString() : 'N/A',
      TransactionID: payout.transaction_id || 'N/A',
      Notes: payout.admin_notes || ''
    }));
    
    const filename = `payout-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(data, filename);
    successToast(`Exported ${data.length} payout records to ${filename}`);
  };
  
  if (loading && payouts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payout history...</p>
      </div>
    );
  }
  
  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Payout History</h3>
        <p className="text-gray-600">
          You haven't requested any payouts yet. Once you have earnings, you can request a payout.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Payout History</h3>
        <button
          onClick={exportPayoutHistory}
          className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
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
                Transaction ID
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payout.requested_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">${payout.amount.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payout.payout_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                    {getStatusIcon(payout.status)}
                    <span className="ml-1 capitalize">{payout.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payout.transaction_id || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedPayout(payout);
                      setShowDetailModal(true);
                    }}
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
      
      {totalPayouts > limit && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalPayouts}
          itemsPerPage={limit}
          onPageChange={setCurrentPage}
        />
      )}
      
      {/* Payout Detail Modal */}
      {showDetailModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative animate-slide-up">
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedPayout(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">Payout Details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900">${selectedPayout.amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="text-gray-900">{selectedPayout.payout_method}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)}`}>
                  {getStatusIcon(selectedPayout.status)}
                  <span className="ml-1 capitalize">{selectedPayout.status}</span>
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Requested:</span>
                <span className="text-gray-900">{new Date(selectedPayout.requested_at).toLocaleString()}</span>
              </div>
              
              {selectedPayout.processed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed:</span>
                  <span className="text-gray-900">{new Date(selectedPayout.processed_at).toLocaleString()}</span>
                </div>
              )}
              
              {selectedPayout.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="text-gray-900">{selectedPayout.transaction_id}</span>
                </div>
              )}
              
              {selectedPayout.admin_notes && (
                <div>
                  <span className="text-gray-600 block mb-1">Admin Notes:</span>
                  <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm">
                    {selectedPayout.admin_notes}
                  </div>
                </div>
              )}
              
              {/* Payout details */}
              {selectedPayout.payout_details && (
                <div>
                  <span className="text-gray-600 block mb-1">Payout Details:</span>
                  <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm">
                    {selectedPayout.payout_method === 'PayPal' && selectedPayout.payout_details.paypal_email && (
                      <div className="mb-2">
                        <span className="font-medium">PayPal Email:</span> {selectedPayout.payout_details.paypal_email}
                      </div>
                    )}
                    
                    {selectedPayout.payout_method === 'Bank Transfer' && selectedPayout.payout_details.bank_details && (
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Account Name:</span> {selectedPayout.payout_details.bank_details.account_name}
                        </div>
                        <div>
                          <span className="font-medium">Bank Name:</span> {selectedPayout.payout_details.bank_details.bank_name}
                        </div>
                      </div>
                    )}
                    
                    {selectedPayout.payout_details.notes && (
                      <div className="mt-2">
                        <span className="font-medium">Additional Notes:</span> {selectedPayout.payout_details.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPayout(null);
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};