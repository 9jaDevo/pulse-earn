import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';
import type {
  TriviaQuestion,
  SpinResult,
  DailyRewardStatus,
  TriviaSubmission,
  TriviaResult,
  AdWatchResult,
  DailyRewardHistory
} from '../types/api';

export interface TriviaGameSummary {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  averageRating: number;
  totalPlayers: number;
  pointsReward: number;
  estimatedTime: string;
}

/**
 * Reward Service
 * 
 * This service handles all daily reward operations including:
 * - Spin & Win functionality with weighted chances
 * - Daily Trivia Challenge system
 * - Watch & Win ad reward system
 * - Reward history tracking
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class RewardService {
  /**
   * Get user's daily reward status
   */
  static async getDailyRewardStatus(userId: string): Promise<ServiceResponse<DailyRewardStatus>> {
    try {
      const { data, error } = await supabase
        .from('user_daily_rewards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error: error.message };
      }

      const today = new Date().toISOString().split('T')[0];
      
      // If no record exists, create one
      if (!data) {
        // First check if the user's profile exists to avoid foreign key constraint violation
        const { data: profile, error: profileError } = await ProfileService.fetchProfileById(userId);
        
        if (profileError || !profile) {
          return { 
            data: null, 
            error: 'User profile not found. Please ensure your account is fully set up.' 
          };
        }

        const { data: newRecord, error: createError } = await supabase
          .from('user_daily_rewards')
          .insert({ user_id: userId })
          .select()
          .maybeSingle();

        if (createError) {
          return { data: null, error: createError.message };
        }

        return {
          data: {
            canSpin: true,
            canPlayTrivia: true,
            canWatchAd: true,
            triviaStreak: 0,
            spinStreak: 0,
            totalSpins: 0,
            totalTriviaCompleted: 0,
            totalAdsWatched: 0
          },
          error: null
        };
      }

      const status: DailyRewardStatus = {
        canSpin: data.last_spin_date !== today,
        canPlayTrivia: data.last_trivia_date !== today,
        canWatchAd: data.last_watch_date !== today,
        lastSpinDate: data.last_spin_date,
        lastTriviaDate: data.last_trivia_date,
        lastWatchDate: data.last_watch_date,
        triviaStreak: data.trivia_streak,
        spinStreak: data.spin_streak,
        totalSpins: data.total_spins,
        totalTriviaCompleted: data.total_trivia_completed,
        totalAdsWatched: data.total_ads_watched
      };

      return { data: status, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get daily reward status'
      };
    }
  }

  /**
   * Get distinct trivia categories from database
   */
  static async getDistinctTriviaCategories(): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('trivia_questions')
        .select('category')
        .eq('is_active', true);

      if (error) {
        return { data: null, error: error.message };
      }

      // Extract unique categories
      const categories = [...new Set((data || []).map(item => item.category))].sort();
      
      return { data: categories, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia categories'
      };
    }
  }

  /**
   * Get distinct trivia difficulties from database
   */
  static async getDistinctTriviaDifficulties(): Promise<ServiceResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('trivia_questions')
        .select('difficulty')
        .eq('is_active', true);

      if (error) {
        return { data: null, error: error.message };
      }

      // Extract unique difficulties and sort by difficulty level
      const difficulties = [...new Set((data || []).map(item => item.difficulty))];
      const sortedDifficulties = difficulties.sort((a, b) => {
        const order = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return order[a as keyof typeof order] - order[b as keyof typeof order];
      });
      
      return { data: sortedDifficulties, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia difficulties'
      };
    }
  }

  /**
   * Get trivia game summaries grouped by category and difficulty
   */
  static async getTriviaGameSummaries(
    options: {
      category?: string;
      difficulty?: string;
      country?: string;
    } = {}
  ): Promise<ServiceResponse<TriviaGameSummary[]>> {
    try {
      const { category, difficulty, country } = options;

      // First try to fetch from trivia_games table
      let query = supabase.from('trivia_games')
        .select('*')
        .eq('is_active', true);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (difficulty && difficulty !== 'all') {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Convert to TriviaGameSummary format
      const summaries: TriviaGameSummary[] = (data || []).map(game => ({
        id: game.id,
        title: game.title,
        description: game.description,
        category: game.category,
        difficulty: game.difficulty,
        questionCount: game.number_of_questions,
        averageRating: 4.5 + Math.random() * 0.5, // Simulated rating between 4.5-5.0
        totalPlayers: Math.floor(Math.random() * 2000) + 500, // Simulated player count
        pointsReward: game.points_reward,
        estimatedTime: `${game.estimated_time_minutes} min`
      }));

      // Sort by category, then by difficulty
      summaries.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        const diffOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      });

      return { data: summaries, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia game summaries'
      };
    }
  }

  /**
   * Fetch a trivia game by ID
   */
  static async fetchTriviaGameById(gameId: string): Promise<ServiceResponse<TriviaGame>> {
    try {
      const { data, error } = await supabase
        .from('trivia_games')
        .select('*')
        .eq('id', gameId)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch trivia game'
      };
    }
  }

  /**
   * Fetch trivia questions for a game
   */
  static async fetchTriviaQuestionsForGame(gameId: string): Promise<ServiceResponse<TriviaQuestion[]>> {
    try {
      // First get the game to get the question_ids
      const { data: game, error: gameError } = await this.fetchTriviaGameById(gameId);
      
      if (gameError || !game) {
        return { data: null, error: gameError || 'Game not found' };
      }
      
      // Then fetch all the questions
      const { data, error } = await supabase
        .from('trivia_questions')
        .select('*')
        .in('id', game.question_ids)
        .eq('is_active', true);

      if (error) {
        return { data: null, error: error.message };
      }

      // Sort questions to match the order in question_ids
      const sortedQuestions = data ? [...data].sort((a, b) => {
        return game.question_ids.indexOf(a.id) - game.question_ids.indexOf(b.id);
      }) : [];

      return { data: sortedQuestions, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch trivia questions'
      };
    }
  }

  /**
   * Submit a completed trivia game
   */
  static async submitTriviaGame(
    userId: string,
    gameId: string,
    answers: number[],
    correctAnswers: number
  ): Promise<ServiceResponse<{
    success: boolean;
    pointsEarned: number;
    score: number;
    message: string;
  }>> {
    try {
      // Get the game details
      const { data: game, error: gameError } = await this.fetchTriviaGameById(gameId);
      
      if (gameError || !game) {
        return { data: null, error: gameError || 'Game not found' };
      }

      // Calculate score as percentage
      const score = Math.round((correctAnswers / game.number_of_questions) * 100);
      
      // Calculate points based on score and game reward
      // Full points for 100%, scaled down for lower scores
      const pointsEarned = Math.round((score / 100) * game.points_reward);

      // Add points to user profile
      const { error: pointsError } = await ProfileService.updateUserPoints(userId, pointsEarned);
      
      if (pointsError) {
        return { data: null, error: pointsError };
      }

      // Record in history
      await supabase
        .from('daily_reward_history')
        .insert({
          user_id: userId,
          reward_type: 'trivia',
          points_earned: pointsEarned,
          reward_data: {
            game_id: gameId,
            score,
            correct_answers: correctAnswers,
            total_questions: game.number_of_questions
          }
        });

      return { 
        data: {
          success: true,
          pointsEarned,
          score,
          message: `You scored ${score}% and earned ${pointsEarned} points!`
        }, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to submit trivia game'
      };
    }
  }

  /**
   * Get trivia questions for a specific category and difficulty
   */
  static async getTriviaQuestionsByGame(
    category: string,
    difficulty: string,
    options: {
      limit?: number;
      country?: string;
    } = {}
  ): Promise<ServiceResponse<TriviaQuestion[]>> {
    try {
      const { limit = 10, country } = options;

      let query = supabase
        .from('trivia_questions')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .eq('difficulty', difficulty)
        .limit(limit);

      if (country) {
        query = query.or(`country.eq.${country},country.is.null`);
      } else {
        query = query.is('country', null);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia questions'
      };
    }
  }

  /**
   * Perform spin with weighted chances
   * Weighted distribution:
   * - Try Again: 40%
   * - 10 points: 25%
   * - 25 points: 20%
   * - 50 points: 10%
   * - 100 points: 4%
   * - 250 points: 1%
   */
  static async performSpin(userId: string): Promise<ServiceResponse<SpinResult>> {
    try {
      // Check if user can spin today
      const { data: status, error: statusError } = await this.getDailyRewardStatus(userId);
      if (statusError || !status?.canSpin) {
        return { data: null, error: 'Cannot spin today. Already spun or error checking status.' };
      }

      // Weighted spin logic
      const random = Math.random() * 100;
      let result: SpinResult;

      if (random < 40) {
        result = { success: false, points: 0, message: 'Try Again Tomorrow!', type: 'try_again' };
      } else if (random < 65) {
        result = { success: true, points: 10, message: 'You won 10 points!', type: 'points' };
      } else if (random < 85) {
        result = { success: true, points: 25, message: 'You won 25 points!', type: 'points' };
      } else if (random < 95) {
        result = { success: true, points: 50, message: 'You won 50 points!', type: 'points' };
      } else if (random < 99) {
        result = { success: true, points: 100, message: 'You won 100 points!', type: 'points' };
      } else {
        result = { success: true, points: 250, message: 'JACKPOT! You won 250 points!', type: 'points' };
      }

      const today = new Date().toISOString().split('T')[0];

      // Update user daily rewards
      const { error: updateError } = await supabase
        .from('user_daily_rewards')
        .update({
          last_spin_date: today,
          spin_streak: result.success ? status.spinStreak + 1 : 0,
          total_spins: status.totalSpins + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      // Add points to user profile if won
      if (result.success && result.points > 0) {
        const { error: pointsError } = await ProfileService.updateUserPoints(userId, result.points);
        if (pointsError) {
          return { data: null, error: pointsError };
        }
      }

      // Record in history
      await supabase
        .from('daily_reward_history')
        .insert({
          user_id: userId,
          reward_type: 'spin',
          points_earned: result.points,
          reward_data: { result: result.type, message: result.message }
        });

      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to perform spin'
      };
    }
  }

  /**
   * Get daily trivia question
   */
  static async getDailyTriviaQuestion(userId: string, userCountry?: string): Promise<ServiceResponse<TriviaQuestion>> {
    try {
      // Check if user can play trivia today
      const { data: status, error: statusError } = await this.getDailyRewardStatus(userId);
      if (statusError || !status?.canPlayTrivia) {
        return { data: null, error: 'Cannot play trivia today. Already completed or error checking status.' };
      }

      // Get a random question, preferring user's country if available
      let query = supabase
        .from('trivia_questions')
        .select('*')
        .eq('is_active', true);

      // If user has a country, try to get a country-specific question first
      if (userCountry) {
        const { data: countryQuestions } = await query.eq('country', userCountry);
        if (countryQuestions && countryQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * countryQuestions.length);
          return { data: countryQuestions[randomIndex], error: null };
        }
      }

      // Get general questions (country is null)
      const { data: questions, error } = await query.is('country', null);

      if (error) {
        return { data: null, error: error.message };
      }

      if (!questions || questions.length === 0) {
        return { data: null, error: 'No trivia questions available' };
      }

      // Return random question
      const randomIndex = Math.floor(Math.random() * questions.length);
      return { data: questions[randomIndex], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia question'
      };
    }
  }

  /**
   * Submit trivia answer and calculate rewards
   */
  static async submitTriviaAnswer(
    userId: string,
    submission: TriviaSubmission
  ): Promise<ServiceResponse<TriviaResult>> {
    try {
      // Get the question to check answer
      const { data: question, error: questionError } = await supabase
        .from('trivia_questions')
        .select('*')
        .eq('id', submission.questionId)
        .maybeSingle();

      if (questionError) {
        return { data: null, error: questionError.message };
      }

      if (!question) {
        return { data: null, error: 'Question not found' };
      }

      const isCorrect = submission.selectedAnswer === question.correct_answer;
      
      // Get current status for streak calculation
      const { data: status, error: statusError } = await this.getDailyRewardStatus(userId);
      if (statusError) {
        return { data: null, error: statusError };
      }

      // Calculate points based on difficulty and correctness
      let basePoints = 0;
      if (isCorrect) {
        switch (question.difficulty) {
          case 'easy':
            basePoints = 10;
            break;
          case 'medium':
            basePoints = 20;
            break;
          case 'hard':
            basePoints = 30;
            break;
        }
      }

      // Calculate streak bonus (10% per day, max 100%)
      const newStreak = isCorrect ? (status?.triviaStreak || 0) + 1 : 0;
      const streakMultiplier = Math.min(newStreak * 0.1, 1.0);
      const streakBonus = Math.floor(basePoints * streakMultiplier);
      const totalPoints = basePoints + streakBonus;

      const today = new Date().toISOString().split('T')[0];

      // Update user daily rewards
      const { error: updateError } = await supabase
        .from('user_daily_rewards')
        .update({
          last_trivia_date: today,
          trivia_streak: newStreak,
          total_trivia_completed: (status?.totalTriviaCompleted || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      // Add points to user profile if correct
      if (totalPoints > 0) {
        const { error: pointsError } = await ProfileService.updateUserPoints(userId, totalPoints);
        if (pointsError) {
          return { data: null, error: pointsError };
        }
      }

      // Record in history
      await supabase
        .from('daily_reward_history')
        .insert({
          user_id: userId,
          reward_type: 'trivia',
          points_earned: totalPoints,
          reward_data: {
            question_id: submission.questionId,
            selected_answer: submission.selectedAnswer,
            correct_answer: question.correct_answer,
            is_correct: isCorrect,
            difficulty: question.difficulty,
            streak_bonus: streakBonus
          }
        });

      const result: TriviaResult = {
        correct: isCorrect,
        correctAnswer: question.correct_answer,
        pointsEarned: totalPoints,
        streakBonus,
        newStreak
      };

      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to submit trivia answer'
      };
    }
  }

  /**
   * Record ad watch and give reward
   */
  static async recordAdWatch(userId: string): Promise<ServiceResponse<AdWatchResult>> {
    try {
      // Check if user can watch ad today
      const { data: status, error: statusError } = await this.getDailyRewardStatus(userId);
      if (statusError || !status?.canWatchAd) {
        return { data: null, error: 'Cannot watch ad today. Already watched or error checking status.' };
      }

      // Fixed reward for watching ads
      const pointsEarned = 15;
      const today = new Date().toISOString().split('T')[0];

      // Update user daily rewards
      const { error: updateError } = await supabase
        .from('user_daily_rewards')
        .update({
          last_watch_date: today,
          total_ads_watched: (status?.totalAdsWatched || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      // Add points to user profile
      const { error: pointsError } = await ProfileService.updateUserPoints(userId, pointsEarned);
      if (pointsError) {
        return { data: null, error: pointsError };
      }

      // Record in history
      await supabase
        .from('daily_reward_history')
        .insert({
          user_id: userId,
          reward_type: 'watch',
          points_earned: pointsEarned,
          reward_data: { ad_type: 'rewarded_video' }
        });

      const result: AdWatchResult = {
        success: true,
        pointsEarned,
        message: `You earned ${pointsEarned} points for watching the ad!`
      };

      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record ad watch'
      };
    }
  }

  /**
   * Get user's reward history
   */
  static async getRewardHistory(
    userId: string,
    options: {
      limit?: number;
      rewardType?: 'spin' | 'trivia' | 'watch';
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ServiceResponse<DailyRewardHistory[]>> {
    try {
      const { limit = 50, rewardType, startDate, endDate } = options;

      let query = supabase
        .from('daily_reward_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (rewardType) {
        query = query.eq('reward_type', rewardType);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get reward history'
      };
    }
  }

  /**
   * Get trivia questions for admin management
   */
  static async getTriviaQuestions(
    options: {
      limit?: number;
      category?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      country?: string;
      isActive?: boolean;
    } = {}
  ): Promise<ServiceResponse<TriviaQuestion[]>> {
    try {
      const { limit = 100, category, difficulty, country, isActive } = options;

      let query = supabase
        .from('trivia_questions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      if (country !== undefined) {
        if (country === null) {
          query = query.is('country', null);
        } else {
          query = query.eq('country', country);
        }
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get trivia questions'
      };
    }
  }

  /**
   * Reset daily rewards for testing (admin only)
   */
  static async resetDailyRewards(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_daily_rewards')
        .update({
          last_spin_date: null,
          last_trivia_date: null,
          last_watch_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to reset daily rewards'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getDailyRewardStatus,
  getDistinctTriviaCategories,
  getDistinctTriviaDifficulties,
  getTriviaGameSummaries,
  getTriviaQuestionsByGame,
  performSpin,
  getDailyTriviaQuestion,
  submitTriviaAnswer,
  recordAdWatch,
  getRewardHistory,
  getTriviaQuestions,
  resetDailyRewards
} = RewardService;