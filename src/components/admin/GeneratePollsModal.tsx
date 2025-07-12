import React, { useState, useEffect } from 'react';
import { X, Cpu, Plus, Globe, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PollService } from '../../services/pollService';
import { OpenAIService } from '../../services/openAIService';
import { CountrySelect } from '../ui/CountrySelect';
import { useToast } from '../../hooks/useToast';

interface GeneratePollsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPollsGenerated: () => void;
}

export const GeneratePollsModal: React.FC<GeneratePollsModalProps> = ({
  isOpen,
  onClose,
  onPollsGenerated
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [numPolls, setNumPolls] = useState(1);
  const [topic, setTopic] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [pollType, setPollType] = useState<'global' | 'country'>('global');
  const [country, setCountry] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    const { data, error } = await PollService.getAllPollCategories();
    if (!error && data) {
      setAvailableCategories(data.map(cat => cat.name));
    }
    setIsLoadingCategories(false);
  };
  
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(cat => cat !== category));
    } else {
      setSelectedCategories(prev => [...prev, category]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to generate polls');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await OpenAIService.generatePolls(user.id, {
        numPolls,
        categories: selectedCategories,
        topic: topic.trim(),
        country: pollType === 'country' ? country : undefined
      });
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        const { totalCreated, totalErrors } = data;
        
        if (totalCreated > 0) {
          successToast(`Successfully generated ${totalCreated} polls${totalErrors > 0 ? ` (${totalErrors} failed)` : ''}`);
          onPollsGenerated();
          onClose();
        } else {
          errorToast('Failed to generate any polls. Please try again.');
        }
      }
    } catch (err) {
      errorToast('Failed to generate polls. Please try again.');
      console.error(err);
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
            <Cpu className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Generate Polls with AI
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Polls to Generate
            </label>
            <input
              type="number"
              value={numPolls}
              onChange={(e) => setNumPolls(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter number of polls (1-10)"
              min="1"
              max="10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum 10 polls can be generated at once
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter a general topic (e.g., Technology, Food, Travel)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank for random topics
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories (Optional)
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {isLoadingCategories ? (
                <div className="w-full text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading categories...</p>
                </div>
              ) : (
                availableCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select categories or leave blank for random categories
            </p>
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
              disabled={loading || (pollType === 'country' && !country)}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-5 w-5" />
                  <span>Generate Polls</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};