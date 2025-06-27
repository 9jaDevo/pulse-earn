import React, { useState, useEffect } from 'react';
import { Brain, Clock, Trophy, Star, Zap, Users, Target, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RewardService, type TriviaGameSummary } from '../services/rewardService';
import { Link } from 'react-router-dom';
import { ContentAd } from '../components/ads/ContentAd';
import { SidebarAd } from '../components/ads/SidebarAd';
import { useToast } from '../hooks/useToast';
import { useCountdown, getNextMidnightUTC } from '../hooks/useCountdown';

export const TriviaPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { errorToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [triviaGames, setTriviaGames] = useState<TriviaGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    bestScore: 0,
    pointsEarned: 0,
    rank: 0
  });
  
  // Daily challenge state
  const [dailyChallengeGame, setDailyChallengeGame] = useState<TriviaGameSummary | null>(null);
  const [dailyChallengeLoading, setDailyChallengeLoading] = useState(true);
  
  // Countdown to next daily challenge
  const nextMidnight = getNextMidnightUTC();
  const countdown = useCountdown(nextMidnight);

  useEffect(() => {
    fetchTriviaData();
  }, []);

  useEffect(() => {
    if (categories.length > 0 || difficulties.length > 0) {
      fetchTriviaGames();
    }
  }, [selectedCategory, selectedDifficulty, categories, difficulties]);

  const fetchTriviaData = async () => {
    setLoading(true);
    setDailyChallengeLoading(true);
    setError(null);

    try {
      // Fetch categories and difficulties in parallel
      const [categoriesResult, difficultiesResult] = await Promise.all([
        RewardService.getDistinctTriviaCategories(),
        RewardService.getDistinctTriviaDifficulties()
      ]);

      if (categoriesResult.error) {
        setError(categoriesResult.error);
        return;
      }

      if (difficultiesResult.error) {
        setError(difficultiesResult.error);
        return;
      }

      setCategories(['All', ...(categoriesResult.data || [])]);
      setDifficulties(['All', ...(difficultiesResult.data || []).map(d => 
        d.charAt(0).toUpperCase() + d.slice(1)
      )]);

      // Set mock stats (in a real implementation, these would come from user data)
      setStats({
        gamesPlayed: 1847,
        bestScore: 98,
        pointsEarned: profile?.points || 0,
        rank: 247
      });
      
      // Fetch daily challenge
      await fetchDailyChallenge();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trivia data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDailyChallenge = async () => {
    try {
      // Fetch all trivia games
      const { data, error } = await RewardService.getTriviaGameSummaries();
      
      if (error || !data || data.length === 0) {
        setDailyChallengeLoading(false);
        return;
      }
      
      // Deterministically select a daily challenge based on the current date
      const today = new Date();
      const dayOfYear = getDayOfYear(today);
      
      // Use the day of year to select a game (ensures same game all day)
      const selectedIndex = dayOfYear % data.length;
      const dailyGame = data[selectedIndex];
      
      // Enhance the daily challenge with bonus points (50% more than normal)
      const enhancedGame = {
        ...dailyGame,
        pointsReward: Math.round(dailyGame.pointsReward * 1.5),
        title: `Daily Challenge: ${dailyGame.title}`
      };
      
      setDailyChallengeGame(enhancedGame);
    } catch (err) {
      console.error('Error fetching daily challenge:', err);
    } finally {
      setDailyChallengeLoading(false);
    }
  };
  
  // Helper function to get day of year (1-366)
  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const fetchTriviaGames = async () => {
    try {
      const { data, error: gameError } = await RewardService.getTriviaGameSummaries({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty.toLowerCase(),
        country: profile?.country
      });

      if (gameError) {
        setError(gameError);
        return;
      }

      setTriviaGames(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trivia games');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success-100 text-success-700';
      case 'medium':
        return 'bg-warning-100 text-warning-700';
      case 'hard':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const generateGameTitle = (category: string, difficulty: string): string => {
    const difficultyAdjectives = {
      easy: 'Basic',
      medium: 'Advanced',
      hard: 'Expert'
    };
    
    return `${difficultyAdjectives[difficulty as keyof typeof difficultyAdjectives] || 'Ultimate'} ${category} Challenge`;
  };

  const generateGameDescription = (category: string, difficulty: string): string => {
    const descriptions = {
      Science: 'Explore the wonders of scientific discovery and natural phenomena',
      History: 'Journey through time and test your knowledge of historical events',
      Sports: 'Challenge yourself with questions about athletics and competitions',
      Entertainment: 'Test your knowledge of movies, TV shows, and pop culture',
      Technology: 'Dive into the world of innovation and digital advancement',
      Geography: 'Discover the world through countries, capitals, and landmarks'
    };
    
    return descriptions[category as keyof typeof descriptions] || `Test your knowledge in ${category}`;
  };
  
  // Format countdown time
  const formatCountdown = (hours: number, minutes: number, seconds: number): string => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trivia challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-secondary-500 to-primary-500 p-4 rounded-2xl">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trivia <span className="bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">Challenges</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test your knowledge across various topics and earn points while having fun!
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Brain className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Games Played</p>
                <p className="text-2xl font-bold text-gray-900">{stats.gamesPlayed.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-success-100 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bestScore}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-accent-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pointsEarned.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-secondary-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-gray-900">#{stats.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category.toLowerCase())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.toLowerCase()
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty.toLowerCase())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDifficulty === difficulty.toLowerCase()
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trivia Games Grid */}
        <div className="flex gap-8">
          <div className="flex-1">
            {/* Content Ad */}
            <ContentAd layout="in-feed" className="mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {triviaGames.map((game) => (
            <div key={game.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
              {/* Game Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded-md text-xs font-medium">
                      {game.category}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {generateGameTitle(game.category, game.difficulty)}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {generateGameDescription(game.category, game.difficulty)}
                  </p>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Target className="h-4 w-4 text-primary-500" />
                  <span>{game.questionCount} questions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-secondary-500" />
                  <span>{game.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-accent-500" />
                  <span>{game.totalPlayers.toLocaleString()} played</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-warning-500" />
                  <span>{game.averageRating.toFixed(1)} rating</span>
                </div>
              </div>

              {/* Reward & Play Button */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-accent-600" />
                  <span className="text-accent-600 font-semibold">+{game.pointsReward} points</span>
                </div>
                {user ? (
                  <Link 
                    to={`/trivia/game/${game.id}`}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all transform hover:scale-105 font-medium inline-flex items-center justify-center"
                  >
                    Play Now
                  </Link>
                ) : (
                  <button 
                    onClick={() => errorToast('Please sign in to play trivia games')}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all transform hover:scale-105 font-medium"
                  >
                    Play Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {triviaGames.length === 0 && !loading && (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trivia games found</h3>
            <p className="text-gray-600">
              {selectedCategory !== 'all' || selectedDifficulty !== 'all' 
                ? 'Try adjusting your filters to see more games.'
                : 'No trivia questions are available at the moment.'
              }
            </p>
          </div>
        )}
          </div>
          
          {/* Sidebar Ad */}
          <div className="hidden lg:block w-80">
            <SidebarAd />
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
          {dailyChallengeLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white">Loading daily challenge...</p>
            </div>
          ) : dailyChallengeGame ? (
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Daily Challenge</h2>
                <p className="text-primary-100 mb-4">
                  {dailyChallengeGame.title.replace('Daily Challenge: ', '')} - Complete today's special trivia challenge for bonus rewards!
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Resets in {formatCountdown(countdown.hours, countdown.minutes, countdown.seconds)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>{dailyChallengeGame.pointsReward} bonus points</span>
                  </span>
                </div>
              </div>
              {user ? (
                <Link 
                  to={`/trivia/game/${dailyChallengeGame.id}`}
                  className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors transform hover:scale-105"
                >
                  Start Challenge
                </Link>
              ) : (
                <button
                  onClick={() => errorToast('Please sign in to play the daily challenge')}
                  className="bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors transform hover:scale-105"
                >
                  Start Challenge
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2">Daily Challenge</h2>
              <p className="text-primary-100 mb-4">
                No daily challenge available at the moment. Please check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};