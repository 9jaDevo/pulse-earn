import React, { useState } from 'react';
import { 
  BarChart, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PauseCircle, 
  PlayCircle, 
  X
} from 'lucide-react';
import type { PromotedPoll } from '../../types/api';

interface PromotedPollDetailModalProps {
  poll: PromotedPoll;
  onClose: () => void;
  onApprove?: () => Promise<void>;
  onReject?: (notes: string) => Promise<void>;
  onPauseResume?: () => Promise<void>;
  userRole?: string;
}

export const PromotedPollDetailModal: React.FC<PromotedPollDetailModalProps> = ({
  poll,
  onClose,
  onApprove,
  onReject,
  onPauseResume,
  userRole = 'user'
}) => {
  const [adminNotes, setAdminNotes] = useState(poll.admin_notes || '');
  const [loading, setLoading] = useState(false);
  
  const isAdmin = userRole === 'admin';
  
  const handleApprove = async () => {
    if (!onApprove) return;
    
    setLoading(true);
    await onApprove();
    setLoading(false);
  };
  
  const handleReject = async () => {
    if (!onReject) return;
    
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    await onReject(adminNotes);
    setLoading(false);
  };
  
  const handlePauseResume = async () => {
    if (!onPauseResume) return;
    
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
            Admin Notes {isAdmin && poll.status === 'pending_approval' && '(Required for rejection)'}
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add notes about this promoted poll..."
            rows={3}
            disabled={!isAdmin}
            readOnly={!isAdmin}
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
          
          {isAdmin && poll.status === 'pending_approval' && (
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
          
          {isAdmin && (poll.status === 'active' || poll.status === 'paused') && (
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