import React, { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users, 
  Info, 
  RefreshCw,
  Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PromotedPollService } from '../../services/promotedPollService';
import { useToast } from '../../hooks/useToast';
import type { PromotedPoll } from '../../types/api';

interface EditPromotedPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPoll: PromotedPoll) => void;
  promotedPoll: PromotedPoll;
}

export const EditPromotedPollModal: React.FC<EditPromotedPollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  promotedPoll
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Promotion settings
  const [settings, setSettings] = useState<{
    default_cost_per_vote: number;
    minimum_budget: number;
    maximum_budget: number;
  }>({
    default_cost_per_vote: 0.05,
    minimum_budget: 10,
    maximum_budget: 1000
  });
  
  // Form data
  const [formData, setFormData] = useState({
    budget: promotedPoll.budget_amount,
    targetVotes: promotedPoll.target_votes,
    startDate: promotedPoll.start_date ? new Date(promotedPoll.start_date).toISOString().split('T')[0] : '',
    endDate: promotedPoll.end_date ? new Date(promotedPoll.end_date).toISOString().split('T')[0] : ''
  });
  
  // Load promotion settings
  useEffect(() => {
    fetchSettings();
  }, []);
  
  // Update target votes when budget changes
  useEffect(() => {
    if (settings.default_cost_per_vote > 0) {
      const targetVotes = Math.floor(formData.budget / settings.default_cost_per_vote);
      setFormData(prev => ({ ...prev, targetVotes }));
    }
  }, [formData.budget, settings.default_cost_per_vote]);
  
  const fetchSettings = async () => {
    try {
      const { data, error } = await PromotedPollService.getPromotedPollSettings();
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        setSettings({
          default_cost_per_vote: data.default_cost_per_vote,
          minimum_budget: data.minimum_budget,
          maximum_budget: data.maximum_budget
        });
      }
    } catch (err) {
      errorToast('Failed to load promotion settings');
    }
  };
  
  const handleBudgetChange = (value: number) => {
    // Ensure budget is within limits
    const budget = Math.max(
      settings.minimum_budget,
      Math.min(settings.maximum_budget, value)
    );
    
    setFormData(prev => ({ ...prev, budget }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to update a promoted poll');
      return;
    }
    
    // Validate dates if provided
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        errorToast('End date must be after start date');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await PromotedPollService.updatePromotedPoll(
        user.id,
        promotedPoll.id,
        {
          budget_amount: formData.budget,
          target_votes: formData.targetVotes,
          start_date: formData.startDate || undefined,
          end_date: formData.endDate || undefined
        }
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (!data) {
        throw new Error('Failed to update promoted poll');
      }
      
      successToast('Promoted poll updated successfully!');
      onSuccess(data);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to update promoted poll');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
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
            <BarChart3 className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Edit Promoted Poll
          </h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Editing Promoted Poll</h3>
            <p className="text-blue-700 text-sm">
              You can update your budget, target votes, and date range for this promotion.
              Changes will be applied immediately for pending promotions.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poll Title (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll
            </label>
            <input
              type="text"
              value={promotedPoll.poll?.title || 'Unknown Poll'}
              readOnly
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
            />
          </div>
          
          {/* Budget Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promotion Budget *
            </label>
            <div className="flex items-center space-x-4">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <input
                type="range"
                min={settings.minimum_budget}
                max={settings.maximum_budget}
                step={5}
                value={formData.budget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-20">
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="w-full p-2 border border-gray-200 rounded-lg text-center"
                  min={settings.minimum_budget}
                  max={settings.maximum_budget}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>${settings.minimum_budget}</span>
              <span>${settings.maximum_budget}</span>
            </div>
          </div>
          
          {/* Target Votes (calculated from budget) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Votes
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={formData.targetVotes}
                readOnly
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on ${settings.default_cost_per_vote.toFixed(2)} per vote
            </p>
          </div>
          
          {/* Date Range (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to start immediately after approval
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to run until budget is spent
              </p>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Promotion Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium">${formData.budget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost per Vote:</span>
                <span className="font-medium">${settings.default_cost_per_vote.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target Votes:</span>
                <span className="font-medium">{formData.targetVotes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {formData.startDate && formData.endDate 
                    ? `${new Date(formData.startDate).toLocaleDateString()} - ${new Date(formData.endDate).toLocaleDateString()}`
                    : 'Until budget is spent'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Update Promotion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};