import React, { useState, useEffect } from 'react';
import { X, Award, Plus } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { Badge, BadgeCriteria } from '../../types/api';
import { BadgeService } from '../../services/badgeService';

interface AddEditBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  badge?: Badge | null;
}

export const AddEditBadgeModal: React.FC<AddEditBadgeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  badge
}) => {
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    icon_url: string;
    criteria_type: string;
    criteria_count: number;
    criteria_difficulty?: string;
    criteria_before?: string;
  }>({
    name: '',
    description: '',
    icon_url: '🏆',
    criteria_type: 'poll_votes',
    criteria_count: 1,
    criteria_difficulty: undefined,
    criteria_before: undefined
  });

  // Set form data when badge changes
  useEffect(() => {
    if (badge) {
      const criteria = badge.criteria as BadgeCriteria;
      setFormData({
        name: badge.name,
        description: badge.description,
        icon_url: badge.icon_url || '🏆',
        criteria_type: criteria.type,
        criteria_count: criteria.count || 1,
        criteria_difficulty: criteria.difficulty,
        criteria_before: criteria.before
      });
    } else {
      // Reset form for new badge
      setFormData({
        name: '',
        description: '',
        icon_url: '🏆',
        criteria_type: 'poll_votes',
        criteria_count: 1,
        criteria_difficulty: undefined,
        criteria_before: undefined
      });
    }
  }, [badge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.description.trim()) {
      errorToast('Name and description are required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Build criteria object
      const criteria: BadgeCriteria = {
        type: formData.criteria_type,
        count: formData.criteria_count
      };
      
      // Add optional criteria fields based on type
      if (formData.criteria_type === 'trivia_completed' && formData.criteria_difficulty) {
        criteria.difficulty = formData.criteria_difficulty;
      }
      
      if (formData.criteria_type === 'early_adopter' && formData.criteria_before) {
        criteria.before = formData.criteria_before;
      }
      
      if (badge) {
        // Update existing badge
        const { error } = await BadgeService.updateBadge(badge.id, {
          name: formData.name,
          description: formData.description,
          icon_url: formData.icon_url,
          criteria
        });
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Badge updated successfully');
      } else {
        // Create new badge
        const { error } = await BadgeService.createBadge({
          name: formData.name,
          description: formData.description,
          icon_url: formData.icon_url,
          criteria
        });
        
        if (error) {
          throw new Error(error);
        }
        
        successToast('Badge created successfully');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving badge:', err);
      errorToast('Failed to save badge');
    } finally {
      setLoading(false);
    }
  };

  // Common badge emojis
  const commonEmojis = ['🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '⭐', '🌟', '💫', '🔥', '⚡', '🎯', '🎮', '🎲', '🧩', '🧠'];

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
          <div className="bg-accent-100 p-3 rounded-lg">
            <Award className="h-6 w-6 text-accent-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {badge ? 'Edit Badge' : 'Create Badge'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Badge Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              placeholder="Enter badge name"
              required
            />
          </div>

          {/* Badge Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              placeholder="Describe how to earn this badge"
              rows={3}
              required
            />
          </div>

          {/* Badge Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Icon
            </label>
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-4xl">{formData.icon_url}</div>
              <input
                type="text"
                value={formData.icon_url}
                onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Enter emoji or icon URL"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon_url: emoji }))}
                  className="w-10 h-10 flex items-center justify-center text-xl border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Criteria Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criteria Type *
            </label>
            <select
              value={formData.criteria_type}
              onChange={(e) => setFormData(prev => ({ ...prev, criteria_type: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              required
            >
              <option value="poll_votes">Poll Votes</option>
              <option value="polls_created">Polls Created</option>
              <option value="trivia_completed">Trivia Completed</option>
              <option value="trivia_perfect">Perfect Trivia Score</option>
              <option value="total_points">Total Points</option>
              <option value="login_streak">Login Streak</option>
              <option value="spin_wins">Spin Wins</option>
              <option value="spin_jackpot">Spin Jackpot</option>
              <option value="ads_watched">Ads Watched</option>
              <option value="referrals">Referrals</option>
              <option value="early_adopter">Early Adopter</option>
            </select>
          </div>

          {/* Criteria Count */}
          {formData.criteria_type !== 'early_adopter' && formData.criteria_type !== 'trivia_perfect' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Count *
              </label>
              <input
                type="number"
                value={formData.criteria_count}
                onChange={(e) => setFormData(prev => ({ ...prev, criteria_count: parseInt(e.target.value) || 1 }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                min="1"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                How many {formData.criteria_type.replace('_', ' ')} are required to earn this badge
              </p>
            </div>
          )}

          {/* Difficulty (for trivia badges) */}
          {formData.criteria_type === 'trivia_completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trivia Difficulty
              </label>
              <select
                value={formData.criteria_difficulty || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, criteria_difficulty: e.target.value || undefined }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              >
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          )}

          {/* Date Cutoff (for early adopter badge) */}
          {formData.criteria_type === 'early_adopter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joined Before Date
              </label>
              <input
                type="date"
                value={formData.criteria_before || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, criteria_before: e.target.value || undefined }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Users who joined before this date will earn the badge
              </p>
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
              className="bg-accent-600 text-white px-6 py-3 rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : badge ? 'Update Badge' : 'Create Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};