import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PromotedPollService } from '../../services/promotedPollService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import { CreatePromotedPollModal } from './CreatePromotedPollModal';
import { EditPromotedPollModal } from './EditPromotedPollModal';
import { PromotedPollAnalyticsModal } from './PromotedPollAnalyticsModal';
import type { PromotedPoll } from '../../types/api';

export const PromotedPollsManagement: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [promotedPolls, setPromotedPolls] = useState<PromotedPoll[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  
  // Fetch promoted polls
  useEffect(() => {
    fetchPromotedPolls();
  }, [currentPage, statusFilter]);
  
  const fetchPromotedPolls = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const options: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      };
      
      if (statusFilter !== 'all') {
        options.status = statusFilter;
      }
      
      const { data, error } = await PromotedPollService.getUserPromotedPolls(user.id, options);
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        setPromotedPolls(data.promotedPolls);
        setTotalCount(data.totalCount);
      }
    } catch (err) {
      errorToast('Failed to load promoted polls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePauseResume = async (promotedPollId: string, currentStatus: string) => {
    if (!user) return;
    
    try {
      if (currentStatus === 'active') {
        const { error } = await PromotedPollService.pausePromotedPoll(user.id, promotedPollId);
        
        if (error) {
          errorToast(error);
          return;
        }
        
        successToast('Campaign paused successfully');
      } else if (currentStatus === 'paused') {
        const { error } = await PromotedPollService.resumePromotedPoll(user.id, promotedPollId);
        
        if (error) {
          errorToast(error);
          return;
        }
        
        successToast('Campaign resumed successfully');
      }
      
      // Refresh the list
      fetchPromotedPolls();
    } catch (err) {
      errorToast('Failed to update campaign status');
      console.error(err);
    }
  };

  const handleRetryPayment = async (promotedPollId: string, paymentMethod: string = 'stripe') => {
    if (!user) return;
    
    setRetryingPayment(promotedPollId);
    
    try {
      const { data, error } = await PromotedPollService.retryPromotedPollPayment(
        user.id,
        promotedPollId,
        paymentMethod
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (!data) {
        errorToast('Failed to initialize payment');
        return;
      }
      
      // Handle different payment methods
      if (data.authorizationUrl) {
        // For Paystack, redirect to the payment page
        window.location.href = data.authorizationUrl;
      } else if (data.clientSecret) {
        // For Stripe, open the payment modal
        // This would typically open a modal with the Stripe Elements
        // For now, we'll just show a success message
        successToast('Payment initialized. Please complete the payment in the modal.');
        
        // In a real implementation, you would open a modal with Stripe Elements
        // For example:
        // setStripeClientSecret(data.clientSecret);
        // setStripeTransactionId(data.transactionId);
        // setShowStripeModal(true);
      } else {
        // For wallet payments or other methods that complete immediately
        successToast('Payment processed successfully!');
        fetchPromotedPolls();
      }
    } catch (err) {
      errorToast('Failed to retry payment');
      console.error(err);
    } finally {
      setRetryingPayment(null);
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-warning-100 text-warning-700';
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'paused':
        return 'bg-gray-100 text-gray-700';
      case 'completed':
        return 'bg-primary-100 text-primary-700';
      case 'rejected':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'paid':
        return 'bg-success-100 text-success-700';
      case 'failed':
        return 'bg-error-100 text-error-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <BarChart className="h-6 w-6 mr-3 text-primary-600" />
          Promoted Polls
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="border border-gray-200 rounded-lg p-2 text-sm"
          >
            <option value="all">All Campaigns</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <button
          onClick={fetchPromotedPolls}
          className="ml-auto p-2 border rounded hover:bg-gray-50 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </button>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && promotedPolls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No promoted polls found</h3>
          <p className="text-gray-600 mb-6">
            {statusFilter !== 'all' 
              ? `You don't have any ${statusFilter.replace('_', ' ')} campaigns.`
              : 'Start promoting your polls to reach a wider audience!'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Your First Campaign
          </button>
        </div>
      )}
      
      {/* Promoted Polls List */}
      {!loading && promotedPolls.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotedPolls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {poll.poll?.title || 'Unknown Poll'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(poll.status)}`}>
                        {poll.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${poll.budget_amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">${poll.cost_per_vote.toFixed(2)} per vote</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-4">
                          <div className="text-sm text-gray-900 mb-1">
                            {poll.current_votes} / {poll.target_votes} votes
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${Math.min((poll.current_votes / poll.target_votes) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(poll.payment_status)}`}>
                        {poll.payment_status}
                      </span>
                      
                      {/* Retry Payment Button */}
                      {(poll.payment_status === 'failed' || poll.payment_status === 'pending') && (
                        <button
                          onClick={() => handleRetryPayment(poll.id)}
                          disabled={retryingPayment === poll.id}
                          className="ml-2 text-primary-600 hover:text-primary-800 text-xs font-medium"
                        >
                          {retryingPayment === poll.id ? 'Processing...' : 'Retry Payment'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(poll.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPollId(poll.id);
                            setShowAnalyticsModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Analytics"
                        >
                          <TrendingUp className="h-5 w-5" />
                        </button>
                        
                        {(poll.status === 'pending_approval' || poll.status === 'paused') && (
                          <button
                            onClick={() => {
                              setSelectedPollId(poll.id);
                              setShowEditModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Campaign"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        
                        {poll.status === 'active' && (
                          <button
                            onClick={() => handlePauseResume(poll.id, poll.status)}
                            className="text-warning-600 hover:text-warning-900"
                            title="Pause Campaign"
                          >
                            <Pause className="h-5 w-5" />
                          </button>
                        )}
                        
                        {poll.status === 'paused' && (
                          <button
                            onClick={() => handlePauseResume(poll.id, poll.status)}
                            className="text-success-600 hover:text-success-900"
                            title="Resume Campaign"
                          >
                            <Play className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Payment Retry Button for Failed/Pending Payments */}
                        {(poll.payment_status === 'failed' || poll.payment_status === 'pending') && (
                          <button
                            onClick={() => handleRetryPayment(poll.id)}
                            disabled={retryingPayment === poll.id}
                            className="text-primary-600 hover:text-primary-900"
                            title="Retry Payment"
                          >
                            <CreditCard className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
            }}
          />
        </div>
      )}
      
      {/* Create Promoted Poll Modal */}
      {showCreateModal && (
        <CreatePromotedPollModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchPromotedPolls();
            setShowCreateModal(false);
          }}
        />
      )}
      
      {/* Edit Promoted Poll Modal */}
      {showEditModal && selectedPollId && (
        <EditPromotedPollModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPollId(null);
          }}
          onSave={() => {
            fetchPromotedPolls();
            setShowEditModal(false);
            setSelectedPollId(null);
          }}
          promotedPollId={selectedPollId}
        />
      )}
      
      {/* Analytics Modal */}
      {showAnalyticsModal && selectedPollId && (
        <PromotedPollAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => {
            setShowAnalyticsModal(false);
            setSelectedPollId(null);
          }}
          promotedPollId={selectedPollId}
        />
      )}
    </div>
  );
};