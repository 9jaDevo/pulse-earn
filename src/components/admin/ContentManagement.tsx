import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  Brain, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Star
} from 'lucide-react';
import { PollService } from '../../services/pollService';
import { RewardService } from '../../services/rewardService';
import { BadgeService } from '../../services/badgeService';
import { useToast } from '../../hooks/useToast';
import type { PollCategory, Poll, TriviaQuestion, Badge, TriviaGame } from '../../types/api';
import { EditPollModal } from '../polls/EditPollModal';
import { DeletePollModal } from '../polls/DeletePollModal';
import { AddEditTriviaModal } from './AddEditTriviaModal';
import { AddEditBadgeModal } from './AddEditBadgeModal';
import { supabase } from '../../lib/supabase';

export const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'polls' | 'categories' | 'trivia' | 'badges'>('polls');
  const { successToast, errorToast } = useToast();
  
  // Category Management State
  const [categories, setCategories] = useState<PollCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Poll Management State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState<string | null>(null);
  const [pollsPage, setPollsPage] = useState(1);
  const [pollsTotalCount, setPollsTotalCount] = useState(0);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [showEditPollModal, setShowEditPollModal] = useState(false);
  const [showDeletePollModal, setShowDeletePollModal] = useState(false);
  const [pollsPerPage] = useState(10);

  // Trivia Management State
  const [triviaGames, setTriviaGames] = useState<any[]>([]);
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [triviaError, setTriviaError] = useState<string | null>(null);
  const [triviaPage, setTriviaPage] = useState(1);
  const [triviaTotalCount, setTriviaTotalCount] = useState(0);
  const [selectedTriviaQuestion, setSelectedTriviaQuestion] = useState<TriviaQuestion | null>(null);
  const [showAddEditTriviaModal, setShowAddEditTriviaModal] = useState(false);
  const [triviaPerPage] = useState(10);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [gameQuestionsMap, setGameQuestionsMap] = useState<Record<string, TriviaQuestion[]>>({});
  const [loadingGameQuestions, setLoadingGameQuestions] = useState<string | null>(null);

  // Badge Management State
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesError, setBadgesError] = useState<string | null>(null);
  const [badgesPage, setBadgesPage] = useState(1);
  const [badgesTotalCount, setBadgesTotalCount] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showAddEditBadgeModal, setShowAddEditBadgeModal] = useState(false);
  const [badgesPerPage] = useState(10);

  // Fetch categories when component mounts
  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  // Fetch polls when polls tab is active or page changes
  useEffect(() => {
    if (activeTab === 'polls') {
      fetchPolls();
    }
  }, [activeTab, pollsPage]);

  // Fetch trivia games when trivia tab is active or page changes
  useEffect(() => {
    if (activeTab === 'trivia') {
      fetchTriviaGames();
    }
  }, [activeTab, triviaPage]);

  // Fetch badges when badges tab is active or page changes
  useEffect(() => {
    if (activeTab === 'badges') {
      fetchBadges();
    }
  }, [activeTab, badgesPage]);

  // Category Management Functions
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await PollService.getAllPollCategories();
      
      if (error) {
        setError(error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      const { data, error } = await PollService.createPollCategory(
        newCategory.name.trim(),
        newCategory.description.trim() || undefined
      );
      
      if (error) {
        setError(error);
      } else if (data) {
        setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategory({ name: '', description: '' });
        setShowCategoryModal(false);
        successToast(`Category "${data.name}" created successfully`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      errorToast('Failed to create category');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // Poll Management Functions
  const fetchPolls = async () => {
    setPollsLoading(true);
    setPollsError(null);
    
    try {
      const offset = (pollsPage - 1) * pollsPerPage;
      
      // Fetch polls with pagination
      const { data, error } = await PollService.fetchPolls(undefined, {
        limit: pollsPerPage,
        offset,
        orderBy: 'created_at',
        order: 'desc',
        includeExpired: true
      });
      
      if (error) {
        setPollsError(error);
        errorToast(`Failed to fetch polls: ${error}`);
      } else {
        setPolls(data || []);
        
        // Get total count for pagination
        const { count } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true });
        
        setPollsTotalCount(count || 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setPollsError(errorMessage);
      errorToast(`Error: ${errorMessage}`);
    } finally {
      setPollsLoading(false);
    }
  };

  const handlePollUpdated = (updatedPoll: Poll) => {
    setPolls(prev => prev.map(poll => poll.id === updatedPoll.id ? updatedPoll : poll));
    setShowEditPollModal(false);
    successToast('Poll updated successfully');
  };

  const handlePollDeleted = () => {
    setPolls(prev => prev.filter(poll => poll.id !== selectedPoll?.id));
    setShowDeletePollModal(false);
    successToast('Poll archived successfully');
  };

  // Trivia Management Functions
  const fetchTriviaGames = async () => {
    setTriviaLoading(true);
    setTriviaError(null);
    
    try {
      const offset = (triviaPage - 1) * triviaPerPage;
      
      // Fetch trivia games with pagination
      const { data, error } = await RewardService.getTriviaGameSummaries({
        limit: triviaPerPage
      });
      
      if (error) {
        setTriviaError(error);
        errorToast(`Failed to fetch trivia games: ${error}`);
      } else {
        setTriviaGames(data || []);
        
        // Get total count for pagination
        const { count } = await supabase
          .from('trivia_games')
          .select('*', { count: 'exact', head: true });
        
        setTriviaTotalCount(count || 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setTriviaError(errorMessage);
      errorToast(`Error: ${errorMessage}`);
    } finally {
      setTriviaLoading(false);
    }
  };

  const fetchQuestionsForGame = async (gameId: string) => {
    // If we already have the questions for this game, no need to fetch again
    if (gameQuestionsMap[gameId]) {
      return;
    }
    
    setLoadingGameQuestions(gameId);
    
    try {
      const { data, error } = await RewardService.fetchTriviaQuestionsForGame(gameId);
      
      if (error) {
        errorToast(`Failed to fetch questions: ${error}`);
      } else {
        setGameQuestionsMap(prev => ({
          ...prev,
          [gameId]: data || []
        }));
      }
    } catch (err) {
      errorToast('Failed to load questions');
      console.error(err);
    } finally {
      setLoadingGameQuestions(null);
    }
  };

  const handleToggleGameExpand = (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
    } else {
      setExpandedGameId(gameId);
      fetchQuestionsForGame(gameId);
    }
  };

  const handleDeleteTriviaQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this trivia question?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('trivia_questions')
        .update({ is_active: false })
        .eq('id', questionId);
      
      if (error) {
        errorToast(`Failed to delete question: ${error.message}`);
      } else {
        successToast('Trivia question deleted successfully');
        
        // Update the local state to remove the deleted question
        setGameQuestionsMap(prev => {
          const newMap = { ...prev };
          
          // Find the game that contains this question and remove it
          Object.keys(newMap).forEach(gameId => {
            newMap[gameId] = newMap[gameId].filter(q => q.id !== questionId);
          });
          
          return newMap;
        });
      }
    } catch (err) {
      errorToast('An unexpected error occurred');
      console.error(err);
    }
  };

  // Badge Management Functions
  const fetchBadges = async () => {
    setBadgesLoading(true);
    setBadgesError(null);
    
    try {
      const offset = (badgesPage - 1) * badgesPerPage;
      
      // Fetch badges with pagination
      const { data, error } = await BadgeService.fetchBadges({
        limit: badgesPerPage,
        offset
      });
      
      if (error) {
        setBadgesError(error);
        errorToast(`Failed to fetch badges: ${error}`);
      } else {
        setBadges(data?.badges || []);
        setBadgesTotalCount(data?.totalCount || 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setBadgesError(errorMessage);
      errorToast(`Error: ${errorMessage}`);
    } finally {
      setBadgesLoading(false);
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('badges')
        .update({ is_active: false })
        .eq('id', badgeId);
      
      if (error) {
        errorToast(`Failed to delete badge: ${error.message}`);
      } else {
        successToast('Badge deleted successfully');
        fetchBadges();
      }
    } catch (err) {
      errorToast('An unexpected error occurred');
      console.error(err);
    }
  };

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Category Management</h2>
        <button 
          onClick={() => setShowCategoryModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-primary-600" />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.is_active 
                          ? 'bg-success-100 text-success-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          {category.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPolls = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Poll Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchPolls}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {pollsError && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {pollsError}
        </div>
      )}

      {pollsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
          <p className="text-gray-600 mb-4">There are no polls in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {polls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{poll.title}</div>
                        <div className="text-sm text-gray-500">{poll.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        poll.type === 'global' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-secondary-100 text-secondary-700'
                      }`}>
                        {poll.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {poll.total_votes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        poll.is_active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {poll.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(poll.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedPoll(poll);
                            setShowEditPollModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Poll"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPoll(poll);
                            setShowDeletePollModal(true);
                          }}
                          className="text-error-600 hover:text-error-900"
                          title="Archive Poll"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pollsTotalCount > pollsPerPage && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pollsPage - 1) * pollsPerPage + 1} to {Math.min(pollsPage * pollsPerPage, pollsTotalCount)} of {pollsTotalCount} polls
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPollsPage(prev => Math.max(prev - 1, 1))}
                  disabled={pollsPage === 1}
                  className={`p-2 rounded-md ${
                    pollsPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPollsPage(prev => prev + 1)}
                  disabled={pollsPage * pollsPerPage >= pollsTotalCount}
                  className={`p-2 rounded-md ${
                    pollsPage * pollsPerPage >= pollsTotalCount
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Edit Poll Modal */}
      {showEditPollModal && selectedPoll && (
        <EditPollModal
          poll={selectedPoll}
          onClose={() => setShowEditPollModal(false)}
          onPollUpdated={handlePollUpdated}
        />
      )}
      
      {/* Delete Poll Modal */}
      {showDeletePollModal && selectedPoll && (
        <DeletePollModal
          poll={selectedPoll}
          onClose={() => setShowDeletePollModal(false)}
          onPollDeleted={handlePollDeleted}
        />
      )}
    </div>
  );

  const renderTrivia = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Trivia Games</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedTriviaQuestion(null);
              setShowAddEditTriviaModal(true);
            }}
            className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>
          <button
            onClick={fetchTriviaGames}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {triviaError && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {triviaError}
        </div>
      )}

      {triviaLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trivia games...</p>
        </div>
      ) : triviaGames.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trivia games found</h3>
          <p className="text-gray-600 mb-4">Add your first trivia game to get started.</p>
          <button
            onClick={() => {
              setSelectedTriviaQuestion(null);
              setShowAddEditTriviaModal(true);
            }}
            className="bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors"
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {triviaGames.map((game) => (
                  <React.Fragment key={game.id}>
                    <tr className={`hover:bg-gray-50 ${expandedGameId === game.id ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleToggleGameExpand(game.id)}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                          >
                            {expandedGameId === game.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{game.title}</div>
                            {game.description && (
                              <div className="text-xs text-gray-500">{game.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-accent-100 text-accent-700">
                          {game.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          game.difficulty === 'easy' ? 'bg-success-100 text-success-700' :
                          game.difficulty === 'medium' ? 'bg-warning-100 text-warning-700' :
                          'bg-error-100 text-error-700'
                        }`}>
                          {game.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {game.questionCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {game.pointsReward}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-secondary-600 hover:text-secondary-900"
                            title="Edit Game"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-error-600 hover:text-error-900"
                            title="Delete Game"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Questions Section */}
                    {expandedGameId === game.id && (
                      <tr>
                        <td colSpan={6} className="px-0 py-0 border-t-0">
                          <div className="bg-gray-50 p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium text-gray-900">Questions in this Game</h3>
                              <button
                                onClick={() => {
                                  setSelectedTriviaQuestion(null);
                                  setShowAddEditTriviaModal(true);
                                }}
                                className="bg-secondary-600 text-white px-3 py-1 rounded-lg hover:bg-secondary-700 transition-colors text-sm flex items-center space-x-1"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Question</span>
                              </button>
                            </div>
                            
                            {loadingGameQuestions === game.id ? (
                              <div className="text-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600 mx-auto mb-2"></div>
                                <p className="text-gray-600">Loading questions...</p>
                              </div>
                            ) : gameQuestionsMap[game.id]?.length === 0 ? (
                              <div className="text-center py-6">
                                <p className="text-gray-600">No questions found for this game.</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Question
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Options
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Correct Answer
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {gameQuestionsMap[game.id]?.map((question) => (
                                      <tr key={question.id} className="hover:bg-gray-100">
                                        <td className="px-4 py-3 text-sm">
                                          {question.question}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                          <ul className="list-disc list-inside">
                                            {question.options.map((option, idx) => (
                                              <li key={idx} className={idx === question.correct_answer ? 'font-bold' : ''}>
                                                {option}
                                              </li>
                                            ))}
                                          </ul>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                          {question.options[question.correct_answer]}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => {
                                                setSelectedTriviaQuestion(question);
                                                setShowAddEditTriviaModal(true);
                                              }}
                                              className="text-secondary-600 hover:text-secondary-900"
                                              title="Edit Question"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTriviaQuestion(question.id)}
                                              className="text-error-600 hover:text-error-900"
                                              title="Delete Question"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {triviaTotalCount > triviaPerPage && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(triviaPage - 1) * triviaPerPage + 1} to {Math.min(triviaPage * triviaPerPage, triviaTotalCount)} of {triviaTotalCount} games
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTriviaPage(prev => Math.max(prev - 1, 1))}
                  disabled={triviaPage === 1}
                  className={`p-2 rounded-md ${
                    triviaPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setTriviaPage(prev => prev + 1)}
                  disabled={triviaPage * triviaPerPage >= triviaTotalCount}
                  className={`p-2 rounded-md ${
                    triviaPage * triviaPerPage >= triviaTotalCount
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add/Edit Trivia Modal */}
      {showAddEditTriviaModal && (
        <AddEditTriviaModal
          isOpen={showAddEditTriviaModal}
          onClose={() => setShowAddEditTriviaModal(false)}
          onSave={() => {
            fetchTriviaGames();
            if (expandedGameId) {
              fetchQuestionsForGame(expandedGameId);
            }
          }}
          question={selectedTriviaQuestion}
        />
      )}
    </div>
  );

  const renderBadges = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Badge Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedBadge(null);
              setShowAddEditBadgeModal(true);
            }}
            className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Badge</span>
          </button>
          <button
            onClick={fetchBadges}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {badgesError && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {badgesError}
        </div>
      )}

      {badgesLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading badges...</p>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-600 mb-4">Create your first badge to get started.</p>
          <button
            onClick={() => {
              setSelectedBadge(null);
              setShowAddEditBadgeModal(true);
            }}
            className="bg-accent-600 text-white px-6 py-3 rounded-lg hover:bg-accent-700 transition-colors"
          >
            Create First Badge
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-accent-100 p-3 rounded-lg">
                    <div className="text-2xl">{badge.icon_url || '🏆'}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBadge(badge);
                        setShowAddEditBadgeModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900"
                      title="Edit Badge"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="text-error-600 hover:text-error-900"
                      title="Delete Badge"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{badge.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{badge.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Criteria:</span>
                    <span className="text-gray-900">
                      {badge.criteria.type.replace('_', ' ')}
                      {badge.criteria.count ? ` (${badge.criteria.count})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      badge.is_active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {badge.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {badgesTotalCount > badgesPerPage && (
            <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700">
                Showing {(badgesPage - 1) * badgesPerPage + 1} to {Math.min(badgesPage * badgesPerPage, badgesTotalCount)} of {badgesTotalCount} badges
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setBadgesPage(prev => Math.max(prev - 1, 1))}
                  disabled={badgesPage === 1}
                  className={`p-2 rounded-md ${
                    badgesPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setBadgesPage(prev => prev + 1)}
                  disabled={badgesPage * badgesPerPage >= badgesTotalCount}
                  className={`p-2 rounded-md ${
                    badgesPage * badgesPerPage >= badgesTotalCount
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Add/Edit Badge Modal */}
      {showAddEditBadgeModal && (
        <AddEditBadgeModal
          isOpen={showAddEditBadgeModal}
          onClose={() => setShowAddEditBadgeModal(false)}
          onSave={fetchBadges}
          badge={selectedBadge}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Management</h1>
        <p className="text-gray-600">Manage polls, trivia questions, badges, and other platform content</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'polls', label: 'Polls', icon: BarChart3 },
            { key: 'categories', label: 'Categories', icon: Tag },
            { key: 'trivia', label: 'Trivia', icon: Brain },
            { key: 'badges', label: 'Badges', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'polls' && renderPolls()}
      {activeTab === 'categories' && renderCategories()}
      {activeTab === 'trivia' && renderTrivia()}
      {activeTab === 'badges' && renderBadges()}
      
      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-slide-up">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Category</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Provide a description for this category"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim() || isCreating}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};