import React, { useState } from 'react';
import { BarChart3, Plus, Clock, Users, Eye, TrendingUp, Search, Filter, Globe, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePolls } from '../hooks/usePolls';
import { Link } from 'react-router-dom';
import { PollService } from '../services/pollService';
import type { Poll, PollCreateRequest, PollCategory } from '../types/api';
import { CountrySelect } from '../components/ui/CountrySelect';
import { CategorySelect } from '../components/ui/CategorySelect';
import { MyPollsTab } from '../components/polls/MyPollsTab';
import { ContentAd } from '../components/ads/ContentAd';
import { SidebarAd } from '../components/ads/SidebarAd';
import { useToast } from '../hooks/useToast';

export const PollsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { 
    polls, 
    loading, 
    error, 
    hasMore,
    activeTab,
    changeTab,
    loadMorePolls,
    voteOnPoll, 
    createPoll, 
    fetchPolls, 
    getPollStats,
  } = usePolls(user?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'global' | 'country'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>(['General']);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [votingPoll, setVotingPoll] = useState<string | null>(null);
  const { successToast, errorToast } = useToast();

  // Create Poll Modal State
  const [newPoll, setNewPoll] = useState<PollCreateRequest>({
    title: '',
    description: '',
    options: ['', ''],
    type: 'global',
    country: '',
    category: '',
    start_date: '',
    active_until: ''
  });

  React.useEffect(() => {
    // Fetch poll statistics
    getPollStats().then(result => {
      if (result.success) {
        setStats(result.stats);
      }
    });
    
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    const { data, error } = await PollService.getAllPollCategories();
    if (!error && data) {
      // Extract only the name property from each category object
      const categoryNames = data.map(category => category.name);
      setCategories(categoryNames);
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
        successToast(`Category "${data.name}" created successfully!`);
      }
    } catch (err) {
      errorToast('Error creating category. Please try again.');
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    
    setVotingPoll(pollId);
    const result = await voteOnPoll({
      poll_id: pollId,
      vote_option: optionIndex
    });
    
    if (result.success) {
      // Success feedback is handled by the UI update
      successToast(`Vote recorded! You earned ${result.result?.pointsEarned || 50} points.`);
    } else {
      errorToast(result.error || 'Failed to vote on poll');
    }
    
    setVotingPoll(null);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!newPoll.title.trim() || newPoll.options.some(opt => !opt.trim())) {
      errorToast('Please fill in all required fields');
      return;
    }

    const result = await createPoll({
      ...newPoll,
      options: newPoll.options.filter(opt => opt.trim()),
      country: newPoll.type === 'country' ? newPoll.country || profile?.country || undefined : undefined,
      start_date: newPoll.start_date || undefined,
      active_until: newPoll.active_until || undefined
    });

    if (result.success) {
      successToast('Poll created successfully!');
      setShowCreateModal(false);
      setNewPoll({
        title: '',
        description: '',
        options: ['', ''],
        country: '',
        category: '',
        start_date: '',
        active_until: ''
      });
    } else {
      errorToast(result.error || 'Failed to create poll');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    // Use the fetchPolls function with search parameters
    fetchPolls({
      searchTerm: searchTerm.trim(),
      type: filterType === 'all' ? undefined : filterType,
      country: filterType === 'country' ? profile?.country : undefined,
      category: filterCategory === 'all' ? undefined : filterCategory,
      page: 1,
      append: false
    });
  };

  const addOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  // Handle tab change
  const handleTabChange = (tab: 'trending' | 'recent' | 'my-polls') => {
    if (!user && tab === 'my-polls') {
      errorToast('Please sign in to view your polls');
      return;
    }
    changeTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Polls</h1>
            <p className="text-gray-600">Share your opinion and earn points with every vote!</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 md:mt-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center space-x-2 transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Create Poll</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search polls..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-auto"
              >
                <option value="all">All Polls</option>
                <option value="global">Global</option>
                <option value="country">Country</option>
              </select>
              <CategorySelect
                value={filterCategory === 'all' ? '' : filterCategory}
                onChange={(category) => setFilterCategory(category || 'all')}
                categories={categories}
                placeholder="All Categories"
                allowNew={false}
                className="w-full sm:w-auto"
              />
              </div>
              <button
                onClick={handleSearch}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: 'trending', label: 'Trending', icon: TrendingUp },
              { key: 'recent', label: 'Recent', icon: Clock },
              { key: 'my-polls', label: 'My Polls', icon: Eye, requiresAuth: true }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as any)}
                disabled={tab.requiresAuth && !user}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${tab.requiresAuth && !user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePolls.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-secondary-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Voters</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-accent-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-gray-900">{(profile?.points || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Loading State */}
        {loading && activeTab !== 'my-polls' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading polls...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* My Polls Tab */}
        {activeTab === 'my-polls' && user ? (
          <MyPollsTab />
        ) : !loading && activeTab !== 'my-polls' && (
          /* Polls Grid for Trending and Recent tabs */
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {polls
    .filter((p): p is Poll => Boolean(p))
    .map(poll => (
            <div key={poll.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <Link to={`/polls/${poll.slug}`} className="block">
                {/* Poll Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {poll.type === 'global' ? (
                          <Globe className="h-4 w-4 text-primary-600" />
                        ) : (
                          <MapPin className="h-4 w-4 text-secondary-600" />
                        )}
                      <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs font-medium">
                          {poll.category}
                      </span>
                      </div>
                      <span className="text-accent-600 font-semibold text-sm">+{poll.reward} points</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-gray-600 text-sm mb-4">{poll.description}</p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Poll Options */}
              <div className="space-y-3 mb-4">
                {poll.options.map((option, index) => {
                  const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => {
                          if (!user) {
                            errorToast('Please sign in to vote on polls');
                            return;
                          }
                          if (!poll.hasVoted) {
                            handleVote(poll.id, index);
                          }
                        }}
                        disabled={poll.hasVoted || votingPoll === poll.id || !user}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          poll.hasVoted || !user
                            ? 'cursor-default'
                            : votingPoll === poll.id
                            ? 'cursor-wait opacity-50'
                            : 'hover:bg-gray-50 cursor-pointer border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-900 font-medium">{option.text}</span>
                          <span className="text-gray-600 text-sm">{option.votes} votes</span>
                        </div>
                        {poll.hasVoted && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                poll.userVote === index
                                  ? 'bg-gradient-to-r from-accent-500 to-accent-600'
                                  : 'bg-gradient-to-r from-primary-500 to-primary-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Poll Footer */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{poll.total_votes} votes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{poll.timeLeft}</span>
                  </span>
                </div>
                {poll.hasVoted && (
                  <span className="text-success-600 font-medium">✓ Voted</span>
                )}
              </div>
            </div>
          ))}
        </div>
            </div>
            
            {/* Sidebar Ad */}
            <div className="hidden lg:block w-80">
              <SidebarAd />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && polls.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a poll!'}
            </p>
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create First Poll
              </button>
            )}
          </div>
        )}

        {/* Create Poll Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Poll</h2>

              <form onSubmit={handleCreatePoll} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Title *
                  </label>
                  <input
                    type="text"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
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
                    value={newPoll.description}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
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
                    value={newPoll.category}
                    onChange={(category) => setNewPoll(prev => ({ ...prev, category }))}
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
                      value={newPoll.start_date}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, start_date: e.target.value }))}
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
                      value={newPoll.active_until}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, active_until: e.target.value }))}
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
                        checked={newPoll.type === 'global'}
                        onChange={(e) => setNewPoll(prev => ({ ...prev, type: e.target.value as any }))}
                        className="mr-2"
                      />
                      <Globe className="h-4 w-4 mr-1" />
                      Global
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="country"
                        checked={newPoll.type === 'country'}
                        onChange={(e) => setNewPoll(prev => ({ ...prev, type: e.target.value as any }))}
                        className="mr-2"
                      />
                      <MapPin className="h-4 w-4 mr-1" />
                      Country
                    </label>
                  </div>
                  
                  {newPoll.type === 'country' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Country
                      </label>
                      <CountrySelect
                        value={newPoll.country}
                        onChange={(country) => setNewPoll(prev => ({ ...prev, country }))}
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
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        {newPoll.options.length > 2 && (
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
                  {newPoll.options.length < 6 && (
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
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Poll'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Load More */}
        {!loading && polls.length > 0 && (
          <div className="text-center mt-12">
          <button 
            onClick={loadMorePolls}
            disabled={!hasMore || loading}
            className={`px-8 py-3 rounded-lg transition-colors ${
              hasMore && !loading
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Loading...' : hasMore ? 'Load More Polls' : 'No More Polls'}
          </button>
        </div>
        )}
      </div>
    </div>
  );
};