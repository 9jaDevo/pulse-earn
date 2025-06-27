import React, { useState, useEffect } from 'react';
import { X, Brain, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { TriviaQuestion } from '../../types/api';
import { RewardService } from '../../services/rewardService';
import { CountrySelect } from '../ui/CountrySelect';
import { supabase } from '../../lib/supabase';

interface AddEditTriviaQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  question?: TriviaQuestion | null;
  gameId: string;
}

export const AddEditTriviaQuestionModal: React.FC<AddEditTriviaQuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  question,
  gameId
}) => {
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [formData, setFormData] = useState<{
    question: string;
    options: string[];
    correct_answer: number;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    country: string;
  }>({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    category: '',
    difficulty: 'medium',
    country: ''
  });

  // Fetch game details, categories and difficulties on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch game details
        if (gameId) {
          const { data: game } = await RewardService.fetchTriviaGameById(gameId);
          if (game) {
            setGameDetails(game);
            setFormData(prev => ({
              ...prev,
              category: game.category,
              difficulty: game.difficulty
            }));
          }
        }
        
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
  }, [gameId]);

  // Set form data when question changes
  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question,
        options: [...question.options],
        correct_answer: question.correct_answer,
        category: question.category,
        difficulty: question.difficulty,
        country: question.country || ''
      });
    } else if (gameDetails) {
      // Reset form for new question but keep game category and difficulty
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        category: gameDetails.category,
        difficulty: gameDetails.difficulty,
        country: ''
      });
    } else {
      // Reset form for new question
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        category: '',
        difficulty: 'medium',
        country: ''
      });
    }
  }, [question, gameDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.question.trim()) {
      errorToast('Question text is required');
      return;
    }
    
    if (!formData.category.trim()) {
      errorToast('Category is required');
      return;
    }
    
    if (formData.options.some(opt => !opt.trim())) {
      errorToast('All options must be filled');
      return;
    }
    
    setLoading(true);
    
    try {
      if (question) {
        // Update existing question
        const { error } = await supabase
          .from('trivia_questions')
          .update({
            question: formData.question,
            options: formData.options,
            correct_answer: formData.correct_answer,
            category: formData.category,
            difficulty: formData.difficulty,
            country: formData.country || null
          })
          .eq('id', question.id);
        
        if (error) {
          throw error;
        }
        
        successToast('Trivia question updated successfully');
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('trivia_questions')
          .insert({
            question: formData.question,
            options: formData.options,
            correct_answer: formData.correct_answer,
            category: formData.category,
            difficulty: formData.difficulty,
            country: formData.country || null,
            is_active: true
          })
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        // If we have a gameId, add this question to the game
        if (gameId && data) {
          // First get the current question_ids
          const { data: game } = await supabase
            .from('trivia_games')
            .select('question_ids, number_of_questions')
            .eq('id', gameId)
            .single();
          
          if (game) {
            const updatedQuestionIds = [...game.question_ids, data.id];
            
            // Update the game with the new question
            await supabase
              .from('trivia_games')
              .update({
                question_ids: updatedQuestionIds,
                number_of_questions: updatedQuestionIds.length,
                updated_at: new Date().toISOString()
              })
              .eq('id', gameId);
          }
        }
        
        successToast('Trivia question created successfully');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving trivia question:', err);
      errorToast('Failed to save trivia question');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      
      // Adjust correct answer index if needed
      let newCorrectAnswer = formData.correct_answer;
      if (index === formData.correct_answer) {
        newCorrectAnswer = 0;
      } else if (index < formData.correct_answer) {
        newCorrectAnswer--;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        options: newOptions,
        correct_answer: newCorrectAnswer
      }));
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
          <div className="bg-secondary-100 p-3 rounded-lg">
            <Brain className="h-6 w-6 text-secondary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {question ? 'Edit Trivia Question' : 'Add Trivia Question'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              placeholder="Enter the trivia question"
              rows={3}
              required
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
                disabled={!!gameDetails} // Disable if we're adding to a specific game
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
            {gameDetails && (
              <p className="text-xs text-gray-500 mt-1">
                Category is fixed to match the game: {gameDetails.category}
              </p>
            )}
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
                    disabled={!!gameDetails} // Disable if we're adding to a specific game
                  />
                  <span className="capitalize">{difficulty}</span>
                </label>
              ))}
            </div>
            {gameDetails && (
              <p className="text-xs text-gray-500 mt-1">
                Difficulty is fixed to match the game: {gameDetails.difficulty}
              </p>
            )}
          </div>

          {/* Country (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              If this question is specific to a country, select it below. Otherwise, leave blank for global questions.
            </p>
            <CountrySelect
              value={formData.country}
              onChange={(country) => setFormData(prev => ({ ...prev, country }))}
              placeholder="Select country (optional)"
              showFlag={true}
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options *
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={formData.correct_answer === index}
                    onChange={() => setFormData(prev => ({ ...prev, correct_answer: index }))}
                    className="text-secondary-600 focus:ring-secondary-500"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-error-600 hover:text-error-700 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 text-secondary-600 hover:text-secondary-700 text-sm font-medium flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </button>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Select the radio button next to the correct answer.
            </p>
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
              disabled={loading}
              className="bg-secondary-600 text-white px-6 py-3 rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : question ? 'Update Question' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};