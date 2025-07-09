import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Target, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PromotedPollService } from '../../services/promotedPollService';
import { useToast } from '../../hooks/useToast';
import type { PromotedPoll } from '../../types/api';

interface EditPromotedPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  promotedPollId: string;
}

export const EditPromotedPollModal: React.FC<EditPromotedPollModalProps> = ({
  isOpen,
  onClose,
  onSave,
  promotedPollId
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promotedPoll, setPromotedPoll] = useState<PromotedPoll | null>(null);
  
  // Form state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [targetVotes, setTargetVotes] = useState<number>(0);
  const [costPerVote, setCostPerVote] = useState<number>(0);
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  
  // Calculated values
  const [totalCost, setTotalCost] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number>(0);
  const [spentBudget, setSpentBudget] = useState<number>(0);
  
  // Load promoted poll data
  useEffect(() => {
    const fetchPromotedPoll = async () => {
      if (!user || !promotedPollId) return;
      
      setLoading(true);
      
      try {
        const { data, error } = await PromotedPollService.getPromotedPollById(promotedPollId);
        
        if (error) {
          errorToast(error);
          return;
        }
        
        if (data) {
          setPromotedPoll(data);
          
          // Set form values
          if (data.start_date) setStartDate(data.start_date.split('T')[0]);
          if (data.end_date) setEndDate(data.end_date.split('T')[0]);
          setTargetVotes(data.target_votes);
          setCostPerVote(data.cost_per_vote);
          setBudgetAmount(data.budget_amount);
          
          // Calculate values
          const spent = data.current_votes * data.cost_per_vote;
          setSpentBudget(spent);
          setRemainingBudget(data.budget_amount - spent);
          setTotalCost(data.target_votes * data.cost_per_vote);
        }
      } catch (err) {
        errorToast('Failed to load promoted poll details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPromotedPoll();
  }, [user, promotedPollId]);
  
  // Update total cost when target votes or cost per vote changes
  useEffect(() => {
    setTotalCost(targetVotes * costPerVote);
  }, [targetVotes, costPerVote]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !promotedPoll) return;
    
    // Validate form
    if (targetVotes < promotedPoll.current_votes) {
      errorToast(`Target votes cannot be less than current votes (${promotedPoll.current_votes})`);
      return;
    }
    
    if (budgetAmount < spentBudget) {
      errorToast(`Budget amount cannot be less than what's already spent ($${spentBudget.toFixed(2)})`);
      return;
    }
    
    if (budgetAmount < totalCost) {
      errorToast(`Budget amount must be at least equal to target votes * cost per vote ($${totalCost.toFixed(2)})`);
      return;
    }
    
    // Check if the poll is in a state that can be updated
    const canEditBudget = promotedPoll.status === 'pending_approval' || promotedPoll.status === 'paused';
    
    // If payment status is 'paid', don't allow budget or cost_per_vote changes
    if (promotedPoll.payment_status === 'paid' && 
        (budgetAmount !== promotedPoll.budget_amount || costPerVote !== promotedPoll.cost_per_vote)) {
      errorToast('Budget and cost per vote cannot be changed after payment has been processed');
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare updates
      const updates: any = {
        target_votes: targetVotes
      };
      
      // Only include budget and cost if they can be edited
      if (canEditBudget) {
        updates.budget_amount = budgetAmount;
        updates.cost_per_vote = costPerVote;
      }
      
      // Include dates if provided
      if (startDate) {
        updates.start_date = new Date(startDate).toISOString();
      }
      
      if (endDate) {
        updates.end_date = new Date(endDate).toISOString();
      }
      
      const { data, error } = await PromotedPollService.updatePromotedPoll(
        user.id,
        promotedPollId,
        updates
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      successToast('Promoted poll updated successfully');
      onSave();
      onClose();
    } catch (err) {
      errorToast('Failed to update promoted poll');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Determine if budget fields should be disabled
  const isBudgetDisabled = promotedPoll?.payment_status === 'paid' || 
                          (promotedPoll?.status !== 'pending_approval' && 
                           promotedPoll?.status !== 'paused');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Promoted Poll</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading promoted poll details...</p>
          </div>
        ) : !promotedPoll ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
            <p className="text-error-600 font-medium mb-2">Promoted poll not found</p>
            <p className="text-gray-600">The promoted poll you're trying to edit doesn't exist or has been removed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Poll Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Poll Information</h3>
              <p className="text-gray-700 font-medium">{promotedPoll.poll?.title}</p>
              <p className="text-gray-500 text-sm">{promotedPoll.poll?.description}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="mr-4">Status: <span className="font-medium capitalize">{promotedPoll.status}</span></span>
                <span>Current Votes: <span className="font-medium">{promotedPoll.current_votes}</span></span>
              </div>
            </div>
            
            {/* Budget Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Settings</h3>
              
              {isBudgetDisabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start space-x-3">
                  <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-700 text-sm">
                      Budget and cost per vote cannot be changed after payment has been processed or when the campaign is active.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Per Vote (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={costPerVote}
                      onChange={(e) => setCostPerVote(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.10"
                      min="0.01"
                      step="0.01"
                      required
                      disabled={isBudgetDisabled}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cost charged per vote on your poll
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Votes *
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={targetVotes}
                      onChange={(e) => setTargetVotes(parseInt(e.target.value) || 0)}
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="1000"
                      min={promotedPoll.current_votes}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Number of votes you want to achieve
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cost (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={totalCost.toFixed(2)}
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Target votes × Cost per vote
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Amount (USD) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="100.00"
                      min={spentBudget}
                      step="0.01"
                      required
                      disabled={isBudgetDisabled}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least equal to total cost
                  </p>
                </div>
              </div>
              
              {promotedPoll.current_votes > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Spent Budget</p>
                    <p className="text-lg font-semibold text-gray-900">${spentBudget.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Remaining Budget</p>
                    <p className="text-lg font-semibold text-gray-900">${remainingBudget.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Schedule Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    When should the campaign start?
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    When should the campaign end?
                  </p>
                </div>
              </div>
            </div>
            
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
                disabled={saving || (isBudgetDisabled && !startDate && !endDate && targetVotes === promotedPoll.target_votes)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};