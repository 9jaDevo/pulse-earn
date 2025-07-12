import { supabase } from '../lib/supabase';
import { ProfileService } from './profileService';
import { SettingsService } from './settingsService';
import type { ServiceResponse } from './profileService';
import type {
  TriviaQuestion,
  SpinResult,
  DailyRewardStatus,
  TriviaSubmission,
  TriviaResult,
  AdWatchResult,
  DailyRewardHistory,
  RedeemItemRequest,
  RedeemItemResult,
  RedeemedItem,
  RewardStoreItem,
  TriviaGame
} from '../types/api';

export interface TriviaGameSummary {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  averageRating: number;
  totalPlayers: number;
  pointsReward: number;
  estimatedTime: string;
  is_active?: boolean;
}

/**
 * Reward Service
 * 
 * This service handles all daily reward operations including:
 * - Spin & Win functionality with weighted chances
 * - Daily Trivia Challenge system
 * - Watch & Win ad reward system
 * - Reward history tracking
 * - Multi-currency support for reward store
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
      limit?: number;
      offset?: number;
      userId?: string;
    } = {}
  ): Promise<ServiceResponse<TriviaGameSummary[]>> {
    try {
      const { category, difficulty, country, limit = 10, offset = 0, userId } = options;

      // First try to fetch from trivia_games table
      let query = supabase.from('trivia_games')
        .select('*')
        .eq('is_active', true)
        .range(offset, offset + limit - 1);

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
      let summaries: TriviaGameSummary[] = (data || []).map(game => ({
        id: game.id,
        title: game.title,
        description: game.description,
        category: game.category,
        difficulty: game.difficulty,
        questionCount: game.number_of_questions,
        averageRating: 4.5 + Math.random() * 0.5, // Simulated rating between 4.5-5.0
        totalPlayers: Math.floor(Math.random() * 2000) + 500, // Simulated player count
        pointsReward: game.points_reward,
        estimatedTime: `${game.estimated_time_minutes} min`,
        is_active: game.is_active
      }));

      // Sort by category, then by difficulty
      summaries.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        const diffOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      });

      // If userId is provided, check which games the user has already played
      if (userId && summaries.length > 0) {
        const gameIds = summaries.map(game => game.id);
        
        // Query daily_reward_history to find completed games with points earned
        const { data: playedGames } = await supabase
          .from('daily_reward_history')
          .select('reward_data')
          .eq('user_id', userId)
          .eq('reward_type', 'trivia')
          .gt('points_earned', 0);
          .filter('reward_data->>game_id', 'eq', gameId);
        if (playedGames && playedGames.length > 0) {
          // Create a set of played game IDs for faster lookup
          const playedGameIds = new Set(
            playedGames
              .filter(entry => entry.reward_data && entry.reward_data.game_id)
              .map(entry => entry.reward_data.game_id)
          );
          
          // Mark games as played
          summaries = summaries.map(game => ({
            ...game,
            hasPlayed: playedGameIds.has(game.id)
          }));
        }
      }

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
   * Get user's trivia statistics
   */
  static async getUserTriviaStats(userId: string): Promise<ServiceResponse<{
    totalGamesPlayed: number;
    bestScore: number;
  }>> {
    try {
      // Get total games played
      const { count: totalGamesPlayed, error: countError } = await supabase
        .from('daily_reward_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reward_type', 'trivia')
        .gt('points_earned', 0);
      
      if (countError) {
        return { data: null, error: countError.message };
      }
      
      // Get best score
      const { data: scoreData, error: scoreError } = await supabase
        .from('daily_reward_history')
        .select('reward_data')
        .eq('user_id', userId)
        .eq('reward_type', 'trivia')
        .order('created_at', { ascending: false });
      
      if (scoreError) {
        return { data: null, error: scoreError.message };
      }
      
      let bestScore = 0;
      if (scoreData && scoreData.length > 0) {
        // Find the maximum score in reward_data
        scoreData.forEach(entry => {
          if (entry.reward_data && entry.reward_data.score) {
            const score = Number(entry.reward_data.score);
            if (!isNaN(score) && score > bestScore) {
              bestScore = score;
            }
          }
        });
      }
      
      return {
        data: {
          totalGamesPlayed: totalGamesPlayed || 0,
          bestScore
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user trivia stats'
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
      // Check if user has already completed this game and earned points
      const { data: existingCompletions, error: checkError } = await supabase
        .from('daily_reward_history')
        .select('*')
        .eq('user_id', userId)
        .eq('reward_type', 'trivia')
        .gt('points_earned', 0)
        .filter('reward_data->game_id', 'eq', gameId);
      
      if (checkError) {
        return { data: null, error: checkError.message };
      }
      
      // If user has already completed this game and earned points, don't award more points
      if (existingCompletions && existingCompletions.length > 0) {
        // Calculate score as percentage
        const score = Math.round((correctAnswers / answers.length) * 100);
        
        return { 
          data: {
            success: true,
            pointsEarned: 0,
            score,
            message: `You scored ${score}%. You've already earned points for this game!`
          }, 
          error: null 
        };
      }

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
   * Get trivia questions with filtering options
   */
  static async getTriviaQuestions(
    options: {
      limit?: number;
      offset?: number;
      category?: string;
      difficulty?: string;
      country?: string;
      isActive?: boolean;
    } = {}
  ): Promise<ServiceResponse<TriviaQuestion[]>> {
    try {
      const { limit = 10, offset = 0, category, difficulty, country, isActive = true } = options;

      let query = supabase
        .from('trivia_questions')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (difficulty) {
        query = query.eq('difficulty', difficulty);
      }

      if (country !== undefined) {
        if (country) {
          query = query.eq('country', country);
        } else {
          query = query.is('country', null);
        }
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

      // Get streak settings from app_settings
      const { data: pointsSettings } = await SettingsService.getSettings('points');
      const maxStreakMultiplier = pointsSettings?.maxStreakMultiplier || 2.0; // Default to 2.0 if not set
      const streakIncrement = pointsSettings?.streakIncrement || 0.1; // Default to 0.1 if not set

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

      // Calculate streak multiplier
      const newStreak = result.success ? (status.spinStreak + 1) : 0;
      const streakMultiplier = Math.min(1 + (newStreak * streakIncrement), maxStreakMultiplier);
      
      // Apply streak multiplier to points
      const basePoints = result.points;
      const bonusPoints = result.success ? Math.floor(basePoints * (streakMultiplier - 1)) : 0;
      const totalPoints = basePoints + bonusPoints;
      
      // Update result with new points total
      if (result.success && bonusPoints > 0) {
        result.points = totalPoints;
        result.message = `You won ${basePoints} points + ${bonusPoints} streak bonus!`;
      }

      // Update user daily rewards
      const { error: updateError } = await supabase
        .from('user_daily_rewards')
        .update({
          last_spin_date: today,
          spin_streak: newStreak,
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
          reward_data: { 
            result: result.type, 
            message: result.message,
            streak: newStreak,
            streakMultiplier: streakMultiplier,
            basePoints: basePoints,
            bonusPoints: bonusPoints
          }
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

      // Get points settings from app_settings
      const { data: pointsSettings } = await SettingsService.getSettings('points');
      
      // Calculate points based on difficulty and correctness
      let basePoints = 0;
      if (isCorrect) {
        switch (question.difficulty) {
          case 'easy':
            basePoints = pointsSettings?.triviaEasyPoints || 10; // Default to 10 if not set
            break;
          case 'medium':
            basePoints = pointsSettings?.triviaMediumPoints || 20; // Default to 20 if not set
            break;
          case 'hard':
            basePoints = pointsSettings?.triviaHardPoints || 30; // Default to 30 if not set
            break;
        }
      }

      // Calculate streak bonus using settings
      const maxStreakMultiplier = pointsSettings?.maxStreakMultiplier || 2.0; // Default to 2.0 if not set
      const streakIncrement = pointsSettings?.streakIncrement || 0.1; // Default to 0.1 if not set
      
      const newStreak = isCorrect ? (status?.triviaStreak || 0) + 1 : 0;
      const streakMultiplier = Math.min(1 + (newStreak * streakIncrement), maxStreakMultiplier);
      const streakBonus = Math.floor(basePoints * (streakMultiplier - 1));
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
            streak_bonus: streakBonus,
            streak_multiplier: streakMultiplier,
            base_points: basePoints
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

      // Get ad watch points from settings
      const { data: pointsSettings } = await SettingsService.getSettings('points');
      const adWatchPoints = pointsSettings?.adWatchPoints || 15; // Default to 15 if not set

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
      const { error: pointsError } = await ProfileService.updateUserPoints(userId, adWatchPoints);
      if (pointsError) {
        return { data: null, error: pointsError };
      }

      // Record in history
      await supabase
        .from('daily_reward_history')
        .insert({
          user_id: userId,
          reward_type: 'watch',
          points_earned: adWatchPoints,
          reward_data: { ad_type: 'rewarded_video' }
        });

      const result: AdWatchResult = {
        success: true,
        pointsEarned: adWatchPoints,
        message: `You earned ${adWatchPoints} points for watching the ad!`
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

  /**
   * Get reward store items
   */
  static async getRewardStoreItems(
    options: {
      limit?: number;
      itemType?: string;
      minPoints?: number;
      maxPoints?: number;
      inStock?: boolean;
      currency?: string;
    } = {}
  ): Promise<ServiceResponse<RewardStoreItem[]>> {
    try {
      const { limit = 50, itemType, minPoints, maxPoints, inStock, currency } = options;

      let query = supabase
        .from('reward_store_items')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true })
        .limit(limit);

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      if (minPoints !== undefined) {
        query = query.gte('points_cost', minPoints);
      }

      if (maxPoints !== undefined) {
        query = query.lte('points_cost', maxPoints);
      }

      if (inStock === true) {
        query = query.or('stock_quantity.gt.0,stock_quantity.is.null');
      }

      if (currency) {
        query = query.eq('currency', currency);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // If currency is provided and items have different currencies, convert points cost
      if (currency && data) {
        const convertedItems = await Promise.all(data.map(async (item) => {
          if (item.currency === currency) {
            return item;
          }
          
          // Convert points cost to the requested currency
          const { data: convertedCost } = await SettingsService.getExchangeRate(item.currency, currency);
          
          if (convertedCost) {
            return {
              ...item,
              points_cost: Math.round(item.points_cost * convertedCost),
              original_currency: item.currency,
              original_points_cost: item.points_cost
            };
          }
          
          return item;
        }));
        
        return { data: convertedItems, error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get reward store items'
      };
    }
  }

  /**
   * Create a new reward store item (admin only)
   */
  static async createRewardStoreItem(
    adminId: string,
    itemData: Omit<RewardStoreItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResponse<RewardStoreItem>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can create reward items' };
      }

      // Ensure currency is set
      const itemWithCurrency = {
        ...itemData,
        currency: itemData.currency || 'USD'
      };

      const { data, error } = await supabase
        .from('reward_store_items')
        .insert(itemWithCurrency)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create reward store item'
      };
    }
  }

  /**
   * Update a reward store item (admin only)
   */
  static async updateRewardStoreItem(
    adminId: string,
    itemId: string,
    updates: Partial<Omit<RewardStoreItem, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResponse<RewardStoreItem>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update reward items' };
      }

      const { data, error } = await supabase
        .from('reward_store_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update reward store item'
      };
    }
  }

  /**
   * Update redemption status (admin only)
   */
  static async updateRedemptionStatus(
    adminId: string,
    redemptionId: string,
    status: 'pending_fulfillment' | 'fulfilled' | 'cancelled',
    fulfillmentDetails?: Record<string, any>
  ): Promise<ServiceResponse<RedeemedItem>> {
    try {
      // Check if user is admin
      const { data: adminProfile, error: adminError } = await ProfileService.fetchProfileById(adminId);
      
      if (adminError || !adminProfile || adminProfile.role !== 'admin') {
        return { data: null, error: 'Unauthorized: Only admins can update redemption status' };
      }

      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (fulfillmentDetails) {
        updates.fulfillment_details = fulfillmentDetails;
      }

      const { data, error } = await supabase
        .from('redeemed_items')
        .update(updates)
        .eq('id', redemptionId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update redemption status'
      };
    }
  }

  /**
   * Get user's redeemed items
   */
  static async getRedeemedItems(
    userId: string,
    options: {
      limit?: number;
      status?: 'pending_fulfillment' | 'fulfilled' | 'cancelled';
      currency?: string;
    } = {}
  ): Promise<ServiceResponse<RedeemedItem[]>> {
    try {
      const { limit = 50, status, currency } = options;

      let query = supabase
        .from('redeemed_items')
        .select('*')
        .eq('user_id', userId)
        .order('redeemed_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // If currency is provided, convert points cost to the requested currency
      if (currency && data) {
        const convertedItems = await Promise.all(data.map(async (item) => {
          // Get the original currency from the item or from the store item
          const { data: storeItem } = await supabase
            .from('reward_store_items')
            .select('currency')
            .eq('id', item.item_id)
            .single();
          
          const itemCurrency = storeItem?.currency || 'USD';
          
          if (itemCurrency === currency) {
            return item;
          }
          
          // Convert points cost to the requested currency
          const { data: convertedCost } = await SettingsService.getExchangeRate(itemCurrency, currency);
          
          if (convertedCost) {
            return {
              ...item,
              points_cost: Math.round(item.points_cost * convertedCost),
              original_currency: itemCurrency,
              original_points_cost: item.points_cost
            };
          }
          
          return item;
        }));
        
        return { data: convertedItems, error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get redeemed items'
      };
    }
  }

  /**
   * Redeem a store item for points
   */
  static async redeemStoreItem(
    userId: string,
    request: RedeemItemRequest
  ): Promise<ServiceResponse<RedeemItemResult>> {
    try {
      // 1. Check if user has enough points
      const { data: profile, error: profileError } = await ProfileService.fetchProfileById(userId);
      
      if (profileError || !profile) {
        return { data: null, error: profileError || 'User profile not found' };
      }
      
      // Get user's preferred currency
      const userCurrency = profile.currency || 'USD';
      
      // 2. Check if the item exists and is available
      const { data: storeItem, error: storeItemError } = await supabase
        .from('reward_store_items')
        .select('*')
        .eq('id', request.itemId)
        .eq('is_active', true)
        .single();

      if (storeItemError) {
        return { data: null, error: 'Item not found or no longer available' };
      }
      
      // Convert item cost to user's currency if different
      let pointsCost = request.pointsCost;
      if (storeItem.currency !== userCurrency) {
        const { data: exchangeRate } = await SettingsService.getExchangeRate(storeItem.currency, userCurrency);
        
        if (exchangeRate) {
          pointsCost = Math.round(request.pointsCost * exchangeRate);
        }
      }
      
      if (profile.points < pointsCost) {
        return { 
          data: null, 
          error: `Insufficient points. You have ${profile.points} points, but this item costs ${pointsCost} points.` 
        };
      }

      // 3. Check if there's enough stock
      if (storeItem.stock_quantity !== null && storeItem.stock_quantity <= 0) {
        return { data: null, error: 'This item is out of stock' };
      }

      // 4. Deduct points from user's profile
      // Note: ProfileService.updateUserPoints adds points, so we pass a negative value to deduct
      const { data: updatedProfile, error: pointsError } = await ProfileService.updateUserPoints(
        userId,
        -pointsCost // Deduct points
      );

      if (pointsError) {
        return { data: null, error: pointsError };
      }

      if (!updatedProfile) {
        return { data: null, error: 'Failed to update user points.' };
      }

      // 5. Record the redemption in the redeemed_items table
      const { data: redeemedItemRecord, error: recordError } = await supabase
        .from('redeemed_items')
        .insert({
          user_id: userId,
          item_id: request.itemId,
          item_name: request.itemName,
          points_cost: pointsCost,
          fulfillment_details: request.fulfillmentDetails || {},
          status: 'pending_fulfillment' // Initial status
        })
        .select()
        .single();

      if (recordError) {
        // If recording fails, attempt to refund the points
        await ProfileService.updateUserPoints(userId, pointsCost);
        return { data: null, error: recordError.message };
      }

      // 6. Update item stock if applicable
      if (storeItem.stock_quantity !== null) {
        await supabase
          .from('reward_store_items')
          .update({ 
            stock_quantity: storeItem.stock_quantity - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.itemId);
      }

      // 7. Record in reward history for tracking
      await supabase
        .from('daily_reward_history')
        .insert({
          user_id: userId,
          reward_type: 'spin', // Using existing type as a workaround
          points_earned: -pointsCost, // Negative to indicate points spent
          reward_data: { 
            redemption_type: 'store_item',
            item_id: request.itemId,
            item_name: request.itemName,
            currency: storeItem.currency,
            user_currency: userCurrency
          }
        });

      const result: RedeemItemResult = {
        success: true,
        message: `Successfully redeemed ${request.itemName} for ${pointsCost} points!`,
        newPointsBalance: updatedProfile.points,
        redeemedItemId: redeemedItemRecord.id
      };

      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to redeem item'
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
  getTriviaQuestions,
  performSpin,
  getDailyTriviaQuestion,
  submitTriviaAnswer,
  recordAdWatch,
  getRewardHistory,
  resetDailyRewards,
  redeemStoreItem,
  getRedeemedItems,
  getRewardStoreItems,
  createRewardStoreItem,
  updateRewardStoreItem,
  updateRedemptionStatus,
  fetchTriviaGameById,
  fetchTriviaQuestionsForGame,
  submitTriviaGame
} = RewardService;