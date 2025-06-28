import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw, 
  PauseCircle, 
  PlayCircle, 
  Info,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PromotedPollService } from '../../services/promotedPollService';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../ui/Pagination';
import type { PromotedPoll } from '../../types/api';

interface PromotedPollDetailModalProps {
  poll: PromotedPoll;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: (notes: string) => Promise<void>;
  onPauseResume: () => Promise<void>;
}

const PromotedPollDetailModal: React.FC<PromotedPollDetailModalProps> = ({
  poll,
  onClose,
  onApprove,
  onReject,
  onPauseResume
}) => {
  const [adminNotes, setAdminNotes] = useState(poll.admin_notes || '');
  const [loading, setLoading] = useState(false);
  
  const handleApprove = async () => {
    setLoading(true);
    await onApprove();
    setLoading(false);
  };
  
  const handleReject = async () => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    await onReject(adminNotes);
    setLoading(false);
  };
  
  const handlePauseResume = async () => {
    setLoading(true);
    await onPauseResume();
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <BarChart className="h-6 w-6 mr-3 text-primary-600" />
          Promoted Poll Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Poll Title</h3>
            <p className="text-gray-900 font-medium">{poll.poll?.title || 'Unknown Poll'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Sponsor</h3>
            <p className="text-gray-900 font-medium">{poll.sponsor?.name || 'Unknown Sponsor'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <div className="flex items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                poll.status === 'pending_approval' ? 'bg-warning-100 text-warning-700' :
                poll.status === 'active' ? 'bg-success-100 text-success-700' :
                poll.status === 'paused' ? 'bg-gray-100 text-gray-700' :
                poll.status === 'completed' ? 'bg-primary-100 text-primary-700' :
                'bg-error-100 text-error-700'
              }`}>
                {poll.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
            <div className="flex items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                poll.payment_status === 'pending' ? 'bg-warning-100 text-warning-700' :
                poll.payment_status === 'paid' ? 'bg-success-100 text-success-700' :
                poll.payment_status === 'failed' ? 'bg-error-100 text-error-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {poll.payment_status}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Budget</h3>
            <p className="text-gray-900 font-medium">${poll.budget_amount.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Cost Per Vote</h3>
            <p className="text-gray-900 font-medium">${poll.cost_per_vote.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Target Votes</h3>
            <p className="text-gray-900 font-medium">{poll.target_votes}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Current Votes</h3>
            <p className="text-gray-900 font-medium">{poll.current_votes}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
            <p className="text-gray-900 font-medium">{new Date(poll.created_at).toLocaleString()}</p>
          </div>
          {poll.approved_at && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Approved At</h3>
              <p className="text-gray-900 font-medium">{new Date(poll.approved_at).toLocaleString()}</p>
            </div>
          )}
          {poll.start_date && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
              <p className="text-gray-900 font-medium">{new Date(poll.start_date).toLocaleString()}</p>
            </div>
          )}
          {poll.end_date && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
              <p className="text-gray-900 font-medium">{new Date(poll.end_date).toLocaleString()}</p>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round((poll.current_votes / poll.target_votes) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${Math.min((poll.current_votes / poll.target_votes) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Admin Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes {poll.status === 'pending_approval' && '(Required for rejection)'}
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add notes about this promoted poll..."
            rows={3}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          
          {poll.status === 'pending_approval' && (
            <>
              <button
                onClick={handleApprove}
                disabled={loading || poll.payment_status !== 'paid'}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Approve</span>
              </button>
              
              <button
                onClick={handleReject}
                disabled={loading || !adminNotes.trim()}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <XCircle className="h-5 w-5" />
                <span>Reject</span>
              </button>
            </>
          )}
          
          {(poll.status === 'active' || poll.status === 'paused') && (
            <button
              onClick={handlePauseResume}
              disabled={loading}
              className={`px-4 py-2 ${
                poll.status === 'active' 
                  ? 'bg-warning-600 hover:bg-warning-700' 
                  : 'bg-success-600 hover:bg-success-700'
              } text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2`}
            >
              {poll.status === 'active' ? (
                <>
                  <PauseCircle className="h-5 w-5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" />
                  <span>Resume</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const PromotedPollsManagement: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [promotedPolls, setPromotedPolls] = useState<PromotedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<PromotedPoll | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    if (user) {
      fetchPromotedPolls();
    }
  }, [user, statusFilter, paymentStatusFilter, currentPage]);
  
  const fetchPromotedPolls = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const options: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        includeDetails: true
      };
      
      if (statusFilter !== 'all') {
        options.status = statusFilter;
      }
      
      if (paymentStatusFilter !== 'all') {
        options.payment_status = paymentStatusFilter;
      }
      
      const { data, error: fetchError } = await PromotedPollService.getAllPromotedPolls(
        user.id,
        options
      );
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setPromotedPolls(data?.promotedPolls || []);
      setTotalItems(data?.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promoted polls');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    // Reset to first page when searching
    setCurrentPage(1);
    fetchPromotedPolls();
  };
  
  const handleApprove = async (pollId: string) => {
    if (!user) return;
    
    try {
      const { error } = await PromotedPollService.updatePromotedPollStatus(
        user.id,
        pollId,
        'active'
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast('Promoted poll approved successfully');
      fetchPromotedPolls();
      setSelectedPoll(null);
    } catch (err) {
      errorToast('Failed to approve promoted poll');
    }
  };
  
  const handleReject = async (pollId: string, notes: string) => {
    if (!user) return;
    
    try {
      const { error } = await PromotedPollService.updatePromotedPollStatus(
        user.id,
        pollId,
        'rejected',
        notes
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast('Promoted poll rejected successfully');
      fetchPromotedPolls();
      setSelectedPoll(null);
    } catch (err) {
      errorToast('Failed to reject promoted poll');
    }
  };
  
  const handlePauseResume = async (poll: PromotedPoll) => {
    if (!user) return;
    
    const newStatus = poll.status === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await PromotedPollService.updatePromotedPoll(
        user.id,
        poll.id,
        { status: newStatus }
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast(`Promoted poll ${newStatus === 'active' ? 'resumed' : 'paused'} successfully`);
      fetchPromotedPolls();
      
      // Update selected poll if it's open
      if (selectedPoll && selectedPoll.id === poll.id) {
        setSelectedPoll({
          ...selectedPoll,
          status: newStatus
        });
      }
    } catch (err) {
      errorToast(`Failed to ${newStatus === 'active' ? 'resume' : 'pause'} promoted poll`);
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
  
  // Filter polls based on search term
  const filteredPolls = searchTerm
    ? promotedPolls.filter(poll => 
        (poll.poll?.title && poll.poll.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (poll.sponsor?.name && poll.sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : promotedPolls;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <BarChart className="h-6 w-6 mr-3 text-primary-600" />
          Promoted Polls Management
        </h2>
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">About Promoted Polls</h3>
          <p className="text-blue-700 text-sm">
            Promoted polls are sponsored content that users pay to have featured prominently on the platform.
            As an admin, you need to review and approve these polls before they go live. You can also pause or
            reject promoted polls that violate platform guidelines.
          </p>
        </div>
      </div>
      
      {/* Filters */}
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
                placeholder="Search by poll title or sponsor name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentStatusFilter('all');
                setCurrentPage(1);
                fetchPromotedPolls();
              }}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
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
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promoted polls...</p>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && filteredPolls.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No promoted polls found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'There are no promoted polls in the system yet.'}
          </p>
        </div>
      )}
      
      {/* Promoted Polls Table */}
      {!loading && filteredPolls.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sponsor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {filteredPolls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {poll.poll?.title || 'Unknown Poll'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {poll.sponsor?.name || 'Unknown Sponsor'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {poll.sponsor?.contact_email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${poll.budget_amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${poll.cost_per_vote.toFixed(2)}/vote
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {poll.current_votes} / {poll.target_votes}
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min((poll.current_votes / poll.target_votes) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(poll.status)}`}>
                        {poll.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadgeColor(poll.payment_status)}`}>
                        {poll.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(poll.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedPoll(poll)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        {poll.status === 'pending_approval' && poll.payment_status === 'paid' && (
                          <button
                            onClick={async () => {
                              await handleApprove(poll.id);
                            }}
                            className="text-success-600 hover:text-success-900"
                            title="Approve"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        
                        {poll.status === 'pending_approval' && (
                          <button
                            onClick={() => setSelectedPoll(poll)}
                            className="text-error-600 hover:text-error-900"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        )}
                        
                        {poll.status === 'active' && (
                          <button
                            onClick={async () => {
                              await handlePauseResume(poll);
                            }}
                            className="text-warning-600 hover:text-warning-900"
                            title="Pause"
                          >
                            <PauseCircle className="h-5 w-5" />
                          </button>
                        )}
                        
                        {poll.status === 'paused' && (
                          <button
                            onClick={async () => {
                              await handlePauseResume(poll);
                            }}
                            className="text-success-600 hover:text-success-900"
                            title="Resume"
                          >
                            <PlayCircle className="h-5 w-5" />
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
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedPoll && (
        <PromotedPollDetailModal
          poll={selectedPoll}
          onClose={() => setSelectedPoll(null)}
          onApprove={async () => {
            await handleApprove(selectedPoll.id);
          }}
          onReject={async (notes) => {
            await handleReject(selectedPoll.id, notes);
          }}
          onPauseResume={async () => {
            await handlePauseResume(selectedPoll);
          }}
        />
      )}
    </div>
  );
};