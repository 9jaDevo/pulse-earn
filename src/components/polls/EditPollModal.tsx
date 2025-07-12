import React, { useState, useEffect } from 'react';
import { X, Plus, Globe, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PollService } from '../../services/pollService';
import { CountrySelect } from '../ui/CountrySelect';
import { CategorySelect } from '../ui/CategorySelect';
import { useToast } from '../../hooks/useToast';
import type { Poll } from '../../types/api';

interface EditPollModalProps {
  poll: Poll;
  onClose: () => void;
  onPollUpdated: (updatedPoll: Poll) => void;
}

export const EditPollModal: React.FC<EditPollModalProps> = ({
  poll,
  onClose,
  onPollUpdated
}) => {
  const { user, profile } = useAuth();
  const { errorToast } = useToast();
  
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || '');
  const [options, setOptions] = useState<string[]>(poll.options.map(opt => opt.text));
  const [pollType, setPollType] = useState<'global' | 'country'>(poll.type);
  const [country, setCountry] = useState(poll.country || '');
  const [category, setCategory] = useState(poll.category);
  const [startDate, setStartDate] = useState(poll.start_date || '');
  const [endDate, setEndDate] = useState(poll.active_until || '');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    const { data, error } = await PollService.getAllPollCategories();
    if (!error && data) {
      setCategories(data.map(cat => cat.name));
    }
    setIsLoadingCategories(false);
  };
  
  const handleCreateCategory = async (category: string): Promise<void> => {
    if (!category.trim()) return;
    
    try {
      const { data, error } = await PollService.createPollCategory(
        category,
        `User-created category for ${category} polls`
      );
      
      if (error) {
        errorToast(`Failed to create category: ${error}`);
        return;
      }
      
      // Add the new category to our list
      if (data) {
        setCategories(prev => [...prev, data.name].sort());
        setCategory(data.name);
      }
    } catch (err) {
      errorToast('Error creating category. Please try again.');
    }
  };
  
  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };
  
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };
  
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to update a poll');
      return;
    }
    
    // Validate form
    if (!title.trim() || options.some(opt => !opt.trim())) {
      errorToast('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await PollService.updatePoll(
        user.id,
        poll.id,
        {
          title,
          description: description || null,
          options: options.filter(opt => opt.trim()).map(text => ({ text, votes: 0 })),
          type: pollType,
          country: pollType === 'country' ? country || null : null,
          category,
          start_date: startDate || null,
          active_until: endDate || null
        }
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        onPollUpdated(data);
      }
    } catch (err) {
      errorToast('Failed to update poll. Please try again.');
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
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Poll</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your poll question"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide more context for your poll"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <CategorySelect
              key={`category-select-${categories.length}`}
              value={category}
              onChange={setCategory}
              categories={categories}
              placeholder="Select or create a category"
              onCreateCategory={handleCreateCategory}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {isLoadingCategories 
                ? 'Loading categories...' 
                : 'Choose a category that best describes your poll topic'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                When should voting begin? Leave empty to start immediately
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                When should voting end? Leave empty for no expiration
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="global"
                  checked={pollType === 'global'}
                  onChange={() => setPollType('global')}
                  className="mr-2"
                />
                <Globe className="h-4 w-4 mr-1" />
                Global
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="country"
                  checked={pollType === 'country'}
                  onChange={() => setPollType('country')}
                  className="mr-2"
                />
                <MapPin className="h-4 w-4 mr-1" />
                Country
              </label>
            </div>
            
            {pollType === 'country' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Country
                </label>
                <CountrySelect
                  value={country}
                  onChange={setCountry}
                  placeholder="Select country for this poll"
                  showFlag={true}
                  showPopular={true}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options * (2-6 options)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-error-600 hover:text-error-700 p-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Option
              </button>
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
              disabled={loading}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};