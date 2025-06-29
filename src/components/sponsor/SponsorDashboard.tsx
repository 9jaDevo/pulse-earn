import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  DollarSign, 
  Users, 
  Clock, 
  Plus, 
  AlertCircle, 
  Info, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SponsorService } from '../../services/sponsorService';
import { PromotedPollService } from '../../services/promotedPollService';
import { useToast } from '../../hooks/useToast';
import { ManageSponsorProfile } from './ManageSponsorProfile';
import { CreatePromotedPollModal } from './CreatePromotedPollModal';
import { PromotedPollDetailModal } from '../common/PromotedPollDetailModal';
import { EditPromotedPollModal } from './EditPromotedPollModal';
import { RetryPaymentModal } from './RetryPaymentModal';
import type { Sponsor, PromotedPoll } from '../../types/api';

export const SponsorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'promoted'>('profile');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [promotedPolls, setPromotedPolls] = useState<PromotedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [isModuleEnabled, setIsModuleEnabled] = useState(true);
  
  // State for promoted poll detail modal
  const [selectedPromotedPoll, setSelectedPromotedPoll] = useState<PromotedPoll | null>(null);
  const [showPromotedPollDetailModal, setShowPromotedPollDetailModal] = useState(false);
  
  // State for edit promoted poll modal
  const [showEditPollModal, setShowEditPollModal] = useState(false);
  const [editingPromotedPoll, setEditingPromotedPoll] = useState<PromotedPoll | null>(null);
  
  // State for retry payment modal
  const [showRetryPaymentModal, setShowRetryPaymentModal] = useState(false);
  const [retryingPaymentPoll, setRetryingPaymentPoll] = useState<PromotedPoll | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchSponsors();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && selectedSponsor) {
      fetchPromotedPolls();
    }
  }, [user, selectedSponsor]);
  
  const fetchSponsors = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await SponsorService.getUserSponsors(user.id);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setSponsors(data || []);
      
      // If there's at least one sponsor, select it
      if (data && data.length > 0) {
        setSelectedSponsor(data[0]);
      }
      
      // Check if promoted polls module is enabled
      const { data: settings } = await PromotedPollService.getPromotedPollSettings();
      setIsModuleEnabled(settings?.is_enabled !== false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPromotedPolls = async () => {
    if (!user || !selectedSponsor) return;
    
    setLoading(true);
    
    try {
      const { data, error: fetchError } = await PromotedPollService.getUserPromotedPolls(
        user.id,
        {
          includeDetails: true
        }
      );
      
      if (fetchError) {
        errorToast(fetchError);
        return;
      }
      
      // Filter polls for the selected sponsor
      const sponsorPolls = data?.promotedPolls.filter(
        poll => poll.sponsor_id === selectedSponsor.id
      ) || [];
      
      setPromotedPolls(sponsorPolls);
    } catch (err) {
      errorToast('Failed to load promoted polls');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSponsorCreated = (sponsor: Sponsor) => {
    setSponsors(prev => [...prev, sponsor]);
    setSelectedSponsor(sponsor);
    successToast('Sponsor profile created successfully!');
  };
  
  const handleSponsorUpdated = (updatedSponsor: Sponsor) => {
    setSponsors(prev => 
      prev.map(s => s.id === updatedSponsor.id ? updatedSponsor : s)
    );
    setSelectedSponsor(updatedSponsor);
    successToast('Sponsor profile updated successfully!');
  };
  
  const handlePromotedPollCreated = () => {
    fetchPromotedPolls();
    successToast('Promoted poll created successfully! It will be reviewed by an admin.');
  };
  
  // Handler for viewing poll details
  const handleViewDetails = (poll: PromotedPoll) => {
    setSelectedPromotedPoll(poll);
    setShowPromotedPollDetailModal(true);
  };
  
  // Handler for editing a promoted poll
  const handleEditPromotedPoll = (poll: PromotedPoll) => {
    setEditingPromotedPoll(poll);
    setShowEditPollModal(true);
  };
  
  // Handler for updating a promoted poll
  const handlePromotedPollUpdated = (updatedPoll: PromotedPoll) => {
    setPromotedPolls(prev => 
      prev.map(p => p.id === updatedPoll.id ? updatedPoll : p)
    );
    setEditingPromotedPoll(null);
    setShowEditPollModal(false);
    successToast('Promoted poll updated successfully!');
  };
  
  // Handler for canceling a promoted poll
  const handleCancelPromotedPoll = async (poll: PromotedPoll) => {
    if (!user) {
      errorToast('You must be logged in to cancel a promoted poll');
      return;
    }
    
    // Confirm with the user
    if (!confirm('Are you sure you want to cancel this promoted poll? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await PromotedPollService.updatePromotedPoll(
        user.id,
        poll.id,
        { 
          status: 'rejected',
          admin_notes: 'Cancelled by sponsor'
        }
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast('Promoted poll cancelled successfully');
      fetchPromotedPolls();
    } catch (err) {
      errorToast('Failed to cancel promoted poll');
    }
  };
  
  // Handler for deleting a promoted poll
  const handleDeletePromotedPoll = async (poll: PromotedPoll) => {
    if (!user) {
      errorToast('You must be logged in to delete a promoted poll');
      return;
    }
    
    // Confirm with the user
    if (!confirm('Are you sure you want to delete this promoted poll? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { data, error } = await PromotedPollService.deletePromotedPoll(user.id, poll.id);
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        successToast('Promoted poll deleted successfully');
        fetchPromotedPolls();
      } else {
        errorToast('Failed to delete promoted poll');
      }
    } catch (err) {
      errorToast('Failed to delete promoted poll');
    }
  };
  
  // Handler for pausing/resuming a promoted poll
  const handlePauseResume = async (poll: PromotedPoll) => {
    if (!user) return;
    
    try {
      if (poll.status === 'active') {
        const { error } = await PromotedPollService.pausePromotedPoll(user.id, poll.id);
        
        if (error) {
          errorToast(error);
          return;
        }
        
        successToast('Campaign paused successfully');
      } else if (poll.status === 'paused') {
        const { error } = await PromotedPollService.resumePromotedPoll(user.id, poll.id);
        
        if (error) {
          errorToast(error);
          return;
        }
        
        successToast('Campaign resumed successfully');
      }
      
      // Refresh the list
      fetchPromotedPolls();
      
      // Update selected poll if it's open
      if (selectedPromotedPoll && selectedPromotedPoll.id === poll.id) {
        setSelectedPromotedPoll({
          ...selectedPromotedPoll,
          status: poll.status === 'active' ? 'paused' : 'active'
        });
      }
    } catch (err) {
      errorToast('Failed to update campaign status');
    }
  };
  
  // Handler for retrying payment
  const handleRetryPayment = (poll: PromotedPoll) => {
    setRetryingPaymentPoll(poll);
    setShowRetryPaymentModal(true);
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
  
  if (!isModuleEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Sponsored Content Unavailable</h3>
        <p className="text-yellow-700 mb-4">
          The sponsored content feature is currently disabled. Please contact the administrator for more information.
        </p>
      </div>
    );
  }
  
  if (loading && sponsors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading sponsor information...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Sponsor Dashboard</h2>
        
        {/* Sponsor Selector */}
        {sponsors.length > 0 && (
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">Active Sponsor:</label>
            <select
              value={selectedSponsor?.id || ''}
              onChange={(e) => {
                const selected = sponsors.find(s => s.id === e.target.value);
                setSelectedSponsor(selected || null);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sponsors.map(sponsor => (
                <option key={sponsor.id} value={sponsor.id}>
                  {sponsor.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">About Sponsored Content</h3>
          <p className="text-blue-700 text-sm">
            Promote your polls to reach a wider audience and get more votes. Create a sponsor profile first, 
            then create promoted polls. You'll be charged based on the number of votes your poll receives.
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Sponsor Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('promoted')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'promoted'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart className="h-4 w-4" />
            <span>Promoted Polls</span>
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'profile' && (
        <ManageSponsorProfile
          sponsor={selectedSponsor}
          onSponsorCreated={handleSponsorCreated}
          onSponsorUpdated={handleSponsorUpdated}
        />
      )}
      
      {activeTab === 'promoted' && (
        <div className="space-y-6">
          {/* Check if sponsor exists */}
          {!selectedSponsor ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-yellow-800 mb-2">No Sponsor Profile</h3>
              <p className="text-yellow-700 mb-4">
                You need to create a sponsor profile before you can promote polls.
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Create Sponsor Profile
              </button>
            </div>
          ) : (
            <>
              {/* Promoted Polls Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Promoted Polls</h3>
                <button
                  onClick={() => setShowCreatePollModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Promote a Poll</span>
                </button>
              </div>
              
              {/* Promoted Polls List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading promoted polls...</p>
                </div>
              ) : promotedPolls.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Promoted Polls</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't promoted any polls yet. Click the button above to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {promotedPolls.map(poll => (
                    <div key={poll.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {poll.poll?.title || 'Poll Title'}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(poll.status)}`}>
                              {poll.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(poll.payment_status)}`}>
                              {poll.payment_status}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-2 md:mt-0">
                          <button
                            onClick={() => handleViewDetails(poll)}
                            className="p-2 text-primary-600 hover:text-primary-800 rounded-full hover:bg-primary-50"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {poll.status === 'pending_approval' && (
                            <button
                              onClick={() => handleEditPromotedPoll(poll)}
                              className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-50"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                          {(poll.status === 'pending_approval' || poll.status === 'rejected') && (
                            <button
                              onClick={() => handleDeletePromotedPoll(poll)}
                              className="p-2 text-error-600 hover:text-error-800 rounded-full hover:bg-error-50"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                          {(poll.payment_status === 'failed' || poll.payment_status === 'pending') && poll.status !== 'rejected' && (
                            <button
                              onClick={() => handleRetryPayment(poll)}
                              className="p-2 text-primary-600 hover:text-primary-800 rounded-full hover:bg-primary-50"
                              title="Retry Payment"
                            >
                              <CreditCard className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DollarSign className="h-5 w-5 text-primary-600 mr-2" />
                              <span className="text-gray-700 font-medium">Budget</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">${poll.budget_amount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="h-5 w-5 text-secondary-600 mr-2" />
                              <span className="text-gray-700 font-medium">Votes</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {poll.current_votes} / {poll.target_votes}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 text-accent-600 mr-2" />
                              <span className="text-gray-700 font-medium">Created</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {new Date(poll.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-2">
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
                      
                      {/* Status Message */}
                      {poll.status === 'pending_approval' && (
                        <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start space-x-2 mt-4">
                          <Clock className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-warning-800 text-sm font-medium">Awaiting Approval</p>
                            <p className="text-warning-700 text-xs">
                              Your promoted poll is being reviewed by an admin. This usually takes 1-2 business days.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {poll.status === 'rejected' && poll.admin_notes && (
                        <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-start space-x-2 mt-4">
                          <XCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-error-800 text-sm font-medium">Promotion Rejected</p>
                            <p className="text-error-700 text-xs">
                              {poll.admin_notes}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {poll.status === 'active' && (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-3 flex items-start space-x-2 mt-4">
                          <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-success-800 text-sm font-medium">Promotion Active</p>
                            <p className="text-success-700 text-xs">
                              Your poll is being promoted! You'll be charged ${poll.cost_per_vote.toFixed(2)} per vote.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Status Message */}
                      {(poll.payment_status === 'failed' || poll.payment_status === 'pending') && poll.status !== 'rejected' && (
                        <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-start space-x-2 mt-4">
                          <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-error-800 text-sm font-medium">
                              Payment {poll.payment_status === 'failed' ? 'Failed' : 'Pending'}
                            </p>
                            <p className="text-error-700 text-xs">
                              {poll.payment_status === 'failed' 
                                ? 'Your payment was not successful. Please retry the payment to activate your campaign.' 
                                : 'Your payment is pending. Please complete the payment to activate your campaign.'}
                            </p>
                            <button
                              onClick={() => handleRetryPayment(poll)}
                              className="mt-2 bg-primary-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-primary-700 transition-colors"
                            >
                              Retry Payment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Create Promoted Poll Modal */}
      {showCreatePollModal && selectedSponsor && (
        <CreatePromotedPollModal
          isOpen={showCreatePollModal}
          onClose={() => setShowCreatePollModal(false)}
          onSuccess={handlePromotedPollCreated}
          sponsorId={selectedSponsor.id}
        />
      )}
      
      {/* Promoted Poll Detail Modal */}
      {showPromotedPollDetailModal && selectedPromotedPoll && (
        <PromotedPollDetailModal
          poll={selectedPromotedPoll}
          userRole={user?.role || 'user'}
          onClose={() => setShowPromotedPollDetailModal(false)}
          onPauseResume={async () => {
            await handlePauseResume(selectedPromotedPoll);
          }}
          onRetryPayment={
            (selectedPromotedPoll.payment_status === 'failed' || selectedPromotedPoll.payment_status === 'pending') && 
            selectedPromotedPoll.status !== 'rejected'
              ? () => handleRetryPayment(selectedPromotedPoll)
              : undefined
          }
        />
      )}
      
      {/* Edit Promoted Poll Modal */}
      {showEditPollModal && editingPromotedPoll && (
        <EditPromotedPollModal
          isOpen={showEditPollModal}
          onClose={() => {
            setShowEditPollModal(false);
            setEditingPromotedPoll(null);
          }}
          onSave={() => {
            fetchPromotedPolls();
            setShowEditPollModal(false);
            setEditingPromotedPoll(null);
          }}
          promotedPollId={editingPromotedPoll.id}
        />
      )}
      
      {/* Retry Payment Modal */}
      {showRetryPaymentModal && retryingPaymentPoll && (
        <RetryPaymentModal
          isOpen={showRetryPaymentModal}
          onClose={() => {
            setShowRetryPaymentModal(false);
            setRetryingPaymentPoll(null);
          }}
          onSuccess={() => {
            fetchPromotedPolls();
            setShowRetryPaymentModal(false);
            setRetryingPaymentPoll(null);
          }}
          promotedPoll={retryingPaymentPoll}
        />
      )}
    </div>
  );
};