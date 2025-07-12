import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  Brain,
  Cpu,
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { PollService } from '../../services/pollService';
import { RewardService } from '../../services/rewardService';
import { BadgeService } from '../../services/badgeService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { GeneratePollsModal } from './GeneratePollsModal';
import { supabase } from '../../lib/supabase';
import { EditPollModal } from '../polls/EditPollModal';
import type { PollCategory, TriviaGame, TriviaGameSummary, TriviaQuestion, Badge } from '../../types/api';
import { AddEditTriviaGameModal } from './AddEditTriviaGameModal';
import { AddEditTriviaQuestionModal } from './AddEditTriviaQuestionModal';
import { AddEditBadgeModal } from './AddEditBadgeModal';
import { CreatePollModal } from '../polls/CreatePollModal';
import { AddEditCategoryModal } from './AddEditCategoryModal';
import { Pagination } from '../ui/Pagination';

export const ContentManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'polls' | 'categories' | 'trivia' | 'badges'>('polls');
  const [categories, setCategories] = useState<PollCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const { successToast, errorToast } = useToast();
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState<PollCategory | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [categoriesPerPage] = useState(10);

  // Poll state
  const [polls, setPolls] = useState<any[]>([]);
  const [pollsPage, setPollsPage] = useState(1);
  const [totalPolls, setTotalPolls] = useState(0);
  const [pollsPerPage] = useState(10);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showEditPollModal, setShowEditPollModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<any>(null);

  // Trivia state
  const [triviaGames, setTriviaGames] = useState<TriviaGameSummary[]>([]);
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [selectedGame, setSelectedGame] = useState<TriviaGame | null>(null);
  const [showTriviaGameModal, setShowTriviaGameModal] = useState(false);
  const [showTriviaQuestionModal, setShowTriviaQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TriviaQuestion | null>(null);
  const [showGeneratePollsModal, setShowGeneratePollsModal] = useState(false);
  const [triviaPage, setTriviaPage] = useState(1);
  const [totalTriviaGames, setTotalTriviaGames] = useState(0);
  const [triviaPerPage] = useState(10);
  const [triviaView, setTriviaView] = useState<'games' | 'questions'>('games');

  // Badge state
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgesPage, setBadgesPage] = useState(1);
  const [totalBadges, setTotalBadges] = useState(0);
  const [badgesPerPage] = useState(10);

  useEffect(() => {
    if (activeTab === 'polls') {
      fetchPolls();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'trivia') {
      if (triviaView === 'games') {
        fetchTriviaGames();
      } else {
        fetchTriviaQuestions();
      }
    } else if (activeTab === 'badges') {
      fetchBadges();
    }
  }, [activeTab, pollsPage, categoriesPage, triviaPage, triviaView, badgesPage]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await PollService.getAllPollCategories();
      
      if (error) {
        setError(error);
      } else {
        setCategories(data?.map(cat => cat.name) || []);
        setTotalCategories(data?.length || 0);
      }
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolls = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would have pagination in your API
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .range((pollsPage - 1) * pollsPerPage, pollsPage * pollsPerPage - 1)
        .order('created_at', { ascending: false });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Get total count
      const { count } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true });
      
      setPolls(data || []);
      setTotalPolls(count || 0);
    } catch (err) {
      setError('Failed to fetch polls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTriviaGames = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await RewardService.getTriviaGameSummaries({
        limit: triviaPerPage,
        offset: (triviaPage - 1) * triviaPerPage
      });
      
      if (error) {
        setError(error);
        return;
      }
      
      // Get total count
      const { count } = await supabase
        .from('trivia_games')
        .select('*', { count: 'exact', head: true });
      
      setTriviaGames(data || []);
      setTotalTriviaGames(count || 0);
    } catch (err) {
      setError('Failed to fetch trivia games');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTriviaQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await RewardService.getTriviaQuestions({
        limit: triviaPerPage,
        offset: (triviaPage - 1) * triviaPerPage
      });
      
      if (error) {
        setError(error);
        return;
      }
      
      // Get total count
      const { count } = await supabase
        .from('trivia_questions')
        .select('*', { count: 'exact', head: true });
      
      setTriviaQuestions(data || []);
      setTotalTriviaGames(count || 0);
    } catch (err) {
      setError('Failed to fetch trivia questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await BadgeService.fetchBadges({
        limit: badgesPerPage,
        offset: (badgesPage - 1) * badgesPerPage
      });
      
      if (error) {
        setError(error);
        return;
      }
      
      setBadges(data?.badges || []);
      setTotalBadges(data?.totalCount || 0);
    } catch (err) {
      setError('Failed to fetch badges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      return;
    }
    
    setLoading(true);
    
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
        successToast('Category created successfully');
      }
    } catch (err) {
      setError('Failed to create category');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: PollCategory) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleToggleCategoryStatus = async (category: PollCategory) => {
    try {
      const { error } = await PollService.updatePollCategory(
        category.id,
        { is_active: !category.is_active }
      );
      
      if (error) {
        errorToast(`Failed to update category: ${error}`);
        return;
      }
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? { ...cat, is_active: !cat.is_active } : cat
      ));
      
      successToast(`Category ${category.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      errorToast('Failed to update category');
      console.error(err);
    }
  };

  const handleEditPoll = (poll: any) => {
    setSelectedPoll(poll);
    setShowEditPollModal(true);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);
      
      if (error) {
        errorToast(`Failed to delete poll: ${error.message}`);
        return;
      }
      
      // Update local state
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
      successToast('Poll deleted successfully');
    } catch (err) {
      errorToast('Failed to delete poll');
      console.error(err);
    }
  };

  const handleTogglePollStatus = async (poll: any) => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: !poll.is_active })
        .eq('id', poll.id);
      
      if (error) {
        errorToast(`Failed to update poll: ${error.message}`);
        return;
      }
      
      // Update local state
      setPolls(prev => prev.map(p => 
        p.id === poll.id ? { ...p, is_active: !p.is_active } : p
      ));
      
      successToast(`Poll ${poll.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      errorToast('Failed to update poll');
      console.error(err);
    }
  };

  const handleDeleteTriviaGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this trivia game?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('trivia_games')
        .delete()
        .eq('id', gameId);
      
      if (error) {
        errorToast(`Failed to delete game: ${error.message}`);
        return;
      }
      
      // Update local state
      setTriviaGames(prev => prev.filter(game => game.id !== gameId));
      successToast('Trivia game deleted successfully');
    } catch (err) {
      errorToast('Failed to delete trivia game');
      console.error(err);
    }
  };

  const handleToggleTriviaGameStatus = async (game: TriviaGameSummary) => {
    try {
      const { error } = await supabase
        .from('trivia_games')
        .update({ is_active: !game.is_active })
        .eq('id', game.id);
      
      if (error) {
        errorToast(`Failed to update game: ${error.message}`);
        return;
      }
      
      // Update local state
      setTriviaGames(prev => prev.map(g => 
        g.id === game.id ? { ...g, is_active: !g.is_active } : g
      ));
      
      successToast(`Game ${game.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      errorToast('Failed to update trivia game');
      console.error(err);
    }
  };

  const handleEditTriviaGame = async (gameId: string) => {
    try {
      const { data, error } = await RewardService.fetchTriviaGameById(gameId);
      
      if (error) {
        errorToast(`Failed to fetch game: ${error}`);
        return;
      }
      
      setSelectedGame(data);
      setShowTriviaGameModal(true);
    } catch (err) {
      errorToast('Failed to fetch trivia game');
      console.error(err);
    }
  };

  const handleDeleteTriviaQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('trivia_questions')
        .delete()
        .eq('id', questionId);
      
      if (error) {
        errorToast(`Failed to delete question: ${error.message}`);
        return;
      }
      
      // Update local state
      setTriviaQuestions(prev => prev.filter(q => q.id !== questionId));
      successToast('Question deleted successfully');
    } catch (err) {
      errorToast('Failed to delete question');
      console.error(err);
    }
  };

  const handleToggleQuestionStatus = async (question: TriviaQuestion) => {
    try {
      const { error } = await supabase
        .from('trivia_questions')
        .update({ is_active: !question.is_active })
        .eq('id', question.id);
      
      if (error) {
        errorToast(`Failed to update question: ${error.message}`);
        return;
      }
      
      // Update local state
      setTriviaQuestions(prev => prev.map(q => 
        q.id === question.id ? { ...q, is_active: !q.is_active } : q
      ));
      
      successToast(`Question ${question.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      errorToast('Failed to update question');
      console.error(err);
    }
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', badgeId);
      
      if (error) {
        errorToast(`Failed to delete badge: ${error.message}`);
        return;
      }
      
      // Update local state
      setBadges(prev => prev.filter(b => b.id !== badgeId));
      successToast('Badge deleted successfully');
    } catch (err) {
      errorToast('Failed to delete badge');
      console.error(err);
    }
  };

  const handleToggleBadgeStatus = async (badge: Badge) => {
    try {
      const { error } = await supabase
        .from('badges')
        .update({ is_active: !badge.is_active })
        .eq('id', badge.id);
      
      if (error) {
        errorToast(`Failed to update badge: ${error.message}`);
        return;
      }
      
      // Update local state
      setBadges(prev => prev.map(b => 
        b.id === badge.id ? { ...b, is_active: !b.is_active } : b
      ));
      
      successToast(`Badge ${badge.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      errorToast('Failed to update badge');
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
                {categories
                  .slice((categoriesPage - 1) * categoriesPerPage, categoriesPage * categoriesPerPage)
                  .map((category) => (
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
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleCategoryStatus(category)}
                          className="text-gray-600 hover:text-gray-900"
                        >
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
          
          {categories.length === 0 && !loading && (
            <div className="text-center py-12">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600">
                Create your first category to get started
              </p>
            </div>
          )}
        </div>
      )}
      
      <Pagination
        currentPage={categoriesPage}
        totalItems={totalCategories}
        itemsPerPage={categoriesPerPage}
        onPageChange={setCategoriesPage}
      />
    </div>
  );

  const renderPolls = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Poll Management</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowGeneratePollsModal(true)}
            className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors flex items-center space-x-2"
          >
            <Cpu className="h-4 w-4" />
            <span>Generate with AI</span>
          </button>
          <button 
            onClick={() => setShowCreatePollModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Poll</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading polls...</p>
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-700">
                        {poll.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(poll.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditPoll(poll)}
                          className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleTogglePollStatus(poll)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {poll.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeletePoll(poll.id)}
                          className="text-error-600 hover:text-error-900"
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
          
          {polls.length === 0 && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
              <p className="text-gray-600">
                Create your first poll to get started
              </p>
            </div>
          )}
        </div>
      )}
      
      <Pagination
        currentPage={pollsPage}
        totalItems={totalPolls}
        itemsPerPage={pollsPerPage}
        onPageChange={setPollsPage}
      />
    </div>
  );

  const renderTrivia = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trivia Management</h2>
          <div className="mt-2 space-x-4">
            <button
              onClick={() => setTriviaView('games')}
              className={`px-3 py-1 rounded-lg text-sm ${
                triviaView === 'games'
                  ? 'bg-secondary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Games
            </button>
            <button
              onClick={() => setTriviaView('questions')}
              className={`px-3 py-1 rounded-lg text-sm ${
                triviaView === 'questions'
                  ? 'bg-secondary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Questions
            </button>
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedGame(null);
            setShowTriviaGameModal(true);
          }}
          className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Game</span>
        </button>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trivia content...</p>
        </div>
      ) : triviaView === 'games' ? (
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {triviaGames.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{game.title}</div>
                      <div className="text-xs text-gray-500">{game.description}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-700">
                        {game.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditTriviaGame(game.id)}
                          className="text-secondary-600 hover:text-secondary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleTriviaGameStatus(game)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {game.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteTriviaGame(game.id)}
                          className="text-error-600 hover:text-error-900"
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
          
          {triviaGames.length === 0 && !loading && (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trivia games found</h3>
              <p className="text-gray-600">
                Create your first trivia game to get started
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">All Questions</h3>
            <button 
              onClick={() => {
                setSelectedQuestion(null);
                setShowTriviaQuestionModal(true);
              }}
              className="bg-secondary-600 text-white px-3 py-1 rounded-lg hover:bg-secondary-700 transition-colors text-sm flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add Question</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {triviaQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{question.question}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Correct: {question.options[question.correct_answer]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-accent-100 text-accent-700">
                        {question.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        question.difficulty === 'easy' ? 'bg-success-100 text-success-700' :
                        question.difficulty === 'medium' ? 'bg-warning-100 text-warning-700' :
                        'bg-error-100 text-error-700'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-700">
                        {question.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowTriviaQuestionModal(true);
                          }}
                          className="text-secondary-600 hover:text-secondary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleQuestionStatus(question)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {question.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteTriviaQuestion(question.id)}
                          className="text-error-600 hover:text-error-900"
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
          
          {triviaQuestions.length === 0 && !loading && (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trivia questions found</h3>
              <p className="text-gray-600">
                Create your first trivia question to get started
              </p>
            </div>
          )}
        </div>
      )}
      
      <Pagination
        currentPage={triviaPage}
        totalItems={totalTriviaGames}
        itemsPerPage={triviaPerPage}
        onPageChange={setTriviaPage}
      />
    </div>
  );

  const renderBadges = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Badge Management</h2>
        <button 
          onClick={() => {
            setSelectedBadge(null);
            setShowBadgeModal(true);
          }}
          className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Badge</span>
        </button>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading badges...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-accent-100 p-3 rounded-lg">
                  <div className="text-2xl">{badge.icon_url || '🏆'}</div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setSelectedBadge(badge);
                      setShowBadgeModal(true);
                    }}
                    className="text-accent-600 hover:text-accent-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleBadgeStatus(badge)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {badge.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => handleDeleteBadge(badge.id)}
                    className="text-error-600 hover:text-error-900"
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
                  <span className="text-gray-900">{badge.criteria.type.replace('_', ' ')}</span>
                </div>
                {badge.criteria.count && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Required:</span>
                    <span className="text-gray-900">{badge.criteria.count}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-700">
                    {badge.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {badges.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-600">
            Create your first badge to get started
          </p>
        </div>
      )}
      
      <Pagination
        currentPage={badgesPage}
        totalItems={totalBadges}
        itemsPerPage={badgesPerPage}
        onPageChange={setBadgesPage}
      />
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
            { key: 'badges', label: 'Badges', icon: Award }
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
        <AddEditCategoryModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onSave={() => {
            fetchCategories();
            setShowCategoryModal(false);
          }}
          category={null}
        />
      )}
      
      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <AddEditCategoryModal
          isOpen={showEditCategoryModal}
          onClose={() => {
            setShowEditCategoryModal(false);
            setSelectedCategory(null);
          }}
          onSave={() => {
            fetchCategories();
            setShowEditCategoryModal(false);
            setSelectedCategory(null);
          }}
          category={selectedCategory}
        />
      )}
      
      {/* Create Poll Modal */}
      {showCreatePollModal && user && (
        <CreatePollModal
          onClose={() => setShowCreatePollModal(false)}
          onPollCreated={(poll) => {
            setPolls(prev => [poll, ...prev]);
            setShowCreatePollModal(false);
            successToast('Poll created successfully!');
          }}
          userId={user.id}
        />
      )}
      
      {/* Edit Poll Modal */}
      {showEditPollModal && selectedPoll && user && (
        <EditPollModal
          poll={selectedPoll}
          onClose={() => {
            setShowEditPollModal(false);
            setSelectedPoll(null);
          }}
          onPollUpdated={(updatedPoll) => {
            setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));
            setShowEditPollModal(false);
            successToast('Poll created successfully!');
          }}
          userId={user.id}
        />
      )}
      
      {/* Edit Poll Modal */}
      {showEditPollModal && selectedPoll && user && (
        <EditPollModal
          poll={selectedPoll}
          onClose={() => {
            setShowEditPollModal(false);
            setSelectedPoll(null);
          }}
          onPollUpdated={(updatedPoll) => {
            setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));
            setShowEditPollModal(false);
            setSelectedPoll(null);
            successToast('Poll updated successfully!');
          }}
          userId={user.id}
        />
      )}
      
      {/* Trivia Game Modal */}
      {showTriviaGameModal && (
        <AddEditTriviaGameModal
          isOpen={showTriviaGameModal}
          onClose={() => {
            setShowTriviaGameModal(false);
            setSelectedGame(null);
          }}
          onSave={() => {
            fetchTriviaGames();
            setShowTriviaGameModal(false);
            setSelectedGame(null);
          }}
          game={selectedGame}
        />
      )}
      
      {/* Trivia Question Modal */}
      {showTriviaQuestionModal && (
        <AddEditTriviaQuestionModal
          isOpen={showTriviaQuestionModal}
          onClose={() => {
            setShowTriviaQuestionModal(false);
            setSelectedQuestion(null);
          }}
          onSave={() => {
            fetchTriviaQuestions();
            setShowTriviaQuestionModal(false);
            setSelectedQuestion(null);
          }}
          question={selectedQuestion}
          gameId=""
        />
      )}
      
      {/* Badge Modal */}
      {showBadgeModal && (
        <AddEditBadgeModal
          isOpen={showBadgeModal}
          onClose={() => {
            setShowBadgeModal(false);
            setSelectedBadge(null);
          }}
          onSave={() => {
            fetchBadges();
            setShowBadgeModal(false);
            setSelectedBadge(null);
          }}
          badge={selectedBadge}
        />
      )}
      
      {/* Generate Polls Modal */}
      {showGeneratePollsModal && (
        <GeneratePollsModal
          isOpen={showGeneratePollsModal}
          onClose={() => setShowGeneratePollsModal(false)}
          onPollsGenerated={fetchPolls}
        />
      )}
    </div>
  );
};