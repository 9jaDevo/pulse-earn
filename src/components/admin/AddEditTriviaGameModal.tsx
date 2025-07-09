import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { TriviaGame, TriviaQuestion } from '../../types/api';
import { RewardService } from '../../services/rewardService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AddEditTriviaQuestionModal } from './AddEditTriviaQuestionModal';

interface AddEditTriviaGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  game?: TriviaGame | null;
}

export const AddEditTriviaGameModal: React.FC<AddEditTriviaGameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  game
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points_reward: number;
    estimated_time_minutes: number;
    question_ids: string[];
  }>({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    points_reward: 50,
    estimated_time_minutes: 5,
    question_ids: []
  });
  
  const [availableQuestions, setAvailableQuestions] = useState<TriviaQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<TriviaQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<'details' | 'questions'>('details');
  const [newlyCreatedGameId, setNewlyCreatedGameId] = useState<string | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Fetch categories, difficulties, and questions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResult, difficultiesResult] = await Promise.all([
          RewardService.getDistinctTriviaCategories(),
          RewardService.getDistinctTriviaDifficulties()
        ]);

        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }

        if (difficultiesResult.data) {
          setDifficulties(difficultiesResult.data);
        }
      } catch (err) {
        console.error('Error fetching trivia data:', err);
      }
    };

    fetchData();
  }, []);

  // Set form data when game changes
  useEffect(() => {
    if (game) {
      setFormData({
        title: game.title,
        description: game.description || '',
        category: game.category,
        difficulty: game.difficulty,
        points_reward: game.points_reward,
        estimated_time_minutes: game.estimated_time_minutes,
        question_ids: game.question_ids
      });
      
      // Fetch selected questions
      fetchQuestionsById(game.question_ids);
      
      // If editing an existing game, start on the questions step
      setCurrentStep('questions');
    } else {
      // Reset form for new game
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: 'medium',
        points_reward: 50,
        estimated_time_minutes: 5,
        question_ids: []
      });
      setSelectedQuestions([]);
      setCurrentStep('details');
    }
  }, [game]);

  // Fetch questions when category or difficulty changes
  useEffect(() => {
    if (formData.category && formData.difficulty && currentStep === 'questions') {
      fetchAvailableQuestions();
    }
  }, [formData.category, formData.difficulty, currentStep]);

  const fetchAvailableQuestions = async () => {
    setLoadingQuestions(true);
    
    try {
      const { data, error } = await RewardService.getTriviaQuestions({
        category: formData.category,
        difficulty: formData.difficulty,
        limit: 100
      });
      
      if (error) {
        errorToast(`Failed to fetch questions: ${error}`);
      } else {
        // Filter out questions that are already selected
        const filteredQuestions = (data || []).filter(
          q => !formData.question_ids.includes(q.id)
        );
        setAvailableQuestions(filteredQuestions);
      }
    } catch (err) {
      errorToast('Failed to load questions');
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchQuestionsById = async (questionIds: string[]) => {
    if (questionIds.length === 0) return;
    
    setLoadingQuestions(true);
    
    try {
      // In a real implementation, you would have an API endpoint to fetch questions by IDs
      // For now, we'll simulate it with multiple queries
      const questions: TriviaQuestion[] = [];
      
      for (const id of questionIds) {
        const { data } = await supabase
          .from('trivia_questions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          questions.push(data as TriviaQuestion);
        }
      }
      
      setSelectedQuestions(questions);
    } catch (err) {
      errorToast('Failed to load selected questions');
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 'details') {
      // Validate details form
      if (!formData.title.trim()) {
        errorToast('Game title is required');
        return;
      }
      
      if (!formData.category.trim()) {
        errorToast('Category is required');
        return;
      }
      
      // If editing an existing game, proceed to questions step
      if (game) {
        setCurrentStep('questions');
        return;
      }
      
      // Create new game
      setLoading(true);
      
      try {
        if (user) {
          const { data, error } = await supabase
            .from('trivia_games')
            .insert({
              title: formData.title,
              description: formData.description || null,
              category: formData.category,
              difficulty: formData.difficulty,
              question_ids: [],
              number_of_questions: 0,
              points_reward: formData.points_reward,
              estimated_time_minutes: formData.estimated_time_minutes,
              created_by: user.id,
              is_active: true
            })
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          if (data) {
            setNewlyCreatedGameId(data.id);
            successToast('Trivia game created! Now add some questions.');
            setCurrentStep('questions');
          }
        }
      } catch (err) {
        console.error('Error creating trivia game:', err);
        errorToast('Failed to create trivia game');
      } finally {
        setLoading(false);
      }
    } else {
      // Validate questions form
      if (formData.question_ids.length === 0) {
        errorToast('At least one question is required');
        return;
      }
      
      setLoading(true);
      
      try {
        const gameId = game?.id || newlyCreatedGameId;
        
        if (!gameId) {
          throw new Error('Game ID not found');
        }
        
        // Update game with questions
        const { error } = await supabase
          .from('trivia_games')
          .update({
            question_ids: formData.question_ids,
            number_of_questions: formData.question_ids.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);
        
        if (error) {
          throw error;
        }
        
        successToast('Trivia game saved successfully!');
        onSave();
        onClose();
      } catch (err) {
        console.error('Error saving trivia game:', err);
        errorToast('Failed to save trivia game');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddQuestion = (question: TriviaQuestion) => {
    // Add to selected questions
    setSelectedQuestions(prev => [...prev, question]);
    
    // Add to question_ids
    setFormData(prev => ({
      ...prev,
      question_ids: [...prev.question_ids, question.id]
    }));
    
    // Remove from available questions
    setAvailableQuestions(prev => prev.filter(q => q.id !== question.id));
  };

  const handleRemoveQuestion = (question: TriviaQuestion) => {
    // Remove from selected questions
    setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
    
    // Remove from question_ids
    setFormData(prev => ({
      ...prev,
      question_ids: prev.question_ids.filter(id => id !== question.id)
    }));
    
    // Add back to available questions if it matches current category/difficulty
    if (question.category === formData.category && question.difficulty === formData.difficulty) {
      setAvailableQuestions(prev => [...prev, question]);
    }
  };
  
  const handleQuestionSaved = () => {
    // Refresh available questions
    fetchAvailableQuestions();
    
    // Refresh selected questions if we have a game ID
    if (game?.id || newlyCreatedGameId) {
      const gameId = game?.id || newlyCreatedGameId;
      if (gameId) {
        // Fetch the updated game to get the new question_ids
        supabase
          .from('trivia_games')
          .select('question_ids')
          .eq('id', gameId)
          .single()
          .then(({ data }) => {
            if (data && data.question_ids) {
              setFormData(prev => ({
                ...prev,
                question_ids: data.question_ids
              }));
              fetchQuestionsById(data.question_ids);
            }
          });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-secondary-100 p-3 rounded-lg">
            <Brain className="h-6 w-6 text-secondary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {game ? 'Edit Trivia Game' : 'Create Trivia Game'}
          </h2>
        </div>
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'details' 
                ? 'bg-secondary-600 text-white' 
                : 'bg-secondary-100 text-secondary-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              currentStep === 'details' ? 'bg-gray-200' : 'bg-secondary-600'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'questions' 
                ? 'bg-secondary-600 text-white' 
                : 'bg-secondary-100 text-secondary-600'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium">Game Details</span>
            <span className="text-sm font-medium">Add Questions</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 'details' ? (
            <div className="space-y-6">
              {/* Game Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Game Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Enter the game title"
                  required
                />
              </div>

              {/* Game Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Enter game description"
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Or enter a new category"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    onChange={(e) => {
                      if (e.target.value && !categories.includes(e.target.value)) {
                        setFormData(prev => ({ ...prev, category: e.target.value }));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <div className="flex space-x-4">
                  {['easy', 'medium', 'hard'].map((difficulty) => (
                    <label key={difficulty} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value={difficulty}
                        checked={formData.difficulty === difficulty}
                        onChange={() => setFormData(prev => ({ ...prev, difficulty: difficulty as 'easy' | 'medium' | 'hard' }))}
                        className="text-secondary-600 focus:ring-secondary-500"
                      />
                      <span className="capitalize">{difficulty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Points Reward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Reward *
                </label>
                <input
                  type="number"
                  value={formData.points_reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Enter points reward"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Points awarded for completing this game
                </p>
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.estimated_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_time_minutes: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Enter estimated time"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Approximate time to complete this game
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Questions to Game
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(true)}
                  className="bg-secondary-600 text-white px-4 py-2 rounded-lg hover:bg-secondary-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Question</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Selected Questions ({selectedQuestions.length})
                    </label>
                    <span className="text-xs text-gray-500">
                      Drag to reorder
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg h-64 overflow-y-auto p-2">
                    {selectedQuestions.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No questions selected
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedQuestions.map((question, index) => (
                          <div 
                            key={question.id} 
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 pr-2">
                              <p className="text-sm font-medium text-gray-900">{question.question}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {question.options.length} options • Correct: {question.options[question.correct_answer]}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(question)}
                              className="text-error-600 hover:text-error-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Questions
                    </label>
                    <span className="text-xs text-gray-500">
                      Click to add
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg h-64 overflow-y-auto p-2">
                    {loadingQuestions ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary-600"></div>
                      </div>
                    ) : availableQuestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p className="mb-2">No matching questions found</p>
                        <p className="text-xs">Create new questions using the button above</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableQuestions.map((question) => (
                          <div 
                            key={question.id} 
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleAddQuestion(question)}
                          >
                            <div className="flex-1 pr-2">
                              <p className="text-sm font-medium text-gray-900">{question.question}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {question.options.length} options • Correct: {question.options[question.correct_answer]}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="text-secondary-600 hover:text-secondary-700 p-1"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {currentStep === 'details' ? (
              <div></div> // Empty div to maintain layout
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep('details')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Details</span>
              </button>
            )}
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (currentStep === 'questions' && formData.question_ids.length === 0)}
                className="bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <span>Saving...</span>
                ) : currentStep === 'details' ? (
                  <>
                    <span>Next: Add Questions</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Save Game</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <AddEditTriviaQuestionModal
          isOpen={showAddQuestionModal}
          onClose={() => setShowAddQuestionModal(false)}
          onSave={handleQuestionSaved}
          gameId={game?.id || newlyCreatedGameId || ''}
          question={null}
        />
      )}
    </div>
  );
};