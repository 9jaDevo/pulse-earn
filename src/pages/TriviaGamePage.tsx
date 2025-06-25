import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Clock, 
  Trophy, 
  Star, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Home,
  Share2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RewardService } from '../services/rewardService';
import type { TriviaGame, TriviaQuestion, TriviaGameSession } from '../types/api';
import { useToast } from '../hooks/useToast';
import { ShareAchievementButton } from '../components/ui/ShareAchievementButton';

export const TriviaGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<TriviaGame | null>(null);
  const [session, setSession] = useState<TriviaGameSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameResults, setGameResults] = useState<{
    score: number;
    pointsEarned: number;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);
  
  // Initialize game session
  useEffect(() => {
    if (!gameId || !user) return;
    
    const fetchGameData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch game details
        const { data: gameData, error: gameError } = await RewardService.fetchTriviaGameById(gameId);
        
        if (gameError || !gameData) {
          setError(gameError || 'Failed to load game data');
          return;
        }
        
        setGame(gameData);
        
        // Fetch questions for the game
        const { data: questions, error: questionsError } = await RewardService.fetchTriviaQuestionsForGame(gameId);
        
        if (questionsError || !questions) {
          setError(questionsError || 'Failed to load questions');
          return;
        }
        
        // Initialize game session
        setSession({
          gameId,
          currentQuestionIndex: 0,
          questions,
          answers: Array(questions.length).fill(-1),
          startTime: new Date()
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameData();
  }, [gameId, user]);
  
  // Current question
  const currentQuestion = session?.questions[session.currentQuestionIndex];
  
  // Timer for the game
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  useEffect(() => {
    if (!session || gameCompleted) return;
    
    // Set initial time based on estimated_time_minutes
    if (game && timeRemaining === 0) {
      setTimeRemaining(game.estimated_time_minutes * 60);
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit if time runs out
          if (!gameCompleted) {
            handleFinishGame();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [session, game, gameCompleted]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleSelectAnswer = (index: number) => {
    if (!session || showResult || isSubmitting) return;
    
    setSelectedAnswer(index);
    
    // Update the session with the selected answer for the current question
    const updatedAnswers = [...session.answers];
    updatedAnswers[session.currentQuestionIndex] = index;
    
    setSession({
      ...session,
      answers: updatedAnswers
    });
  };
  
  // Handle submitting an answer
  const handleSubmitAnswer = () => {
    if (!session || selectedAnswer === null || showResult || isSubmitting) return;
    
    // Check if answer is correct
    const isAnswerCorrect = selectedAnswer === currentQuestion?.correct_answer;
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    
    // Update session with the answer
    const updatedAnswers = [...session.answers];
    updatedAnswers[session.currentQuestionIndex] = selectedAnswer;
    
    setSession({
      ...session,
      answers: updatedAnswers
    });
    
    // Show result for 1.5 seconds before moving to next question
    setTimeout(() => {
      setShowResult(false);
      
      // If this was the last question, finish the game
      if (session.currentQuestionIndex === session.questions.length - 1) {
        handleFinishGame(updatedAnswers);
      } else {
        // Move to next question
        setSession({
          ...session,
          currentQuestionIndex: session.currentQuestionIndex + 1
        });
        setSelectedAnswer(null);
      }
    }, 1500);
  };
  
  // Handle navigation between questions
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!session) return;
    
    const newIndex = direction === 'next' 
      ? Math.min(session.currentQuestionIndex + 1, session.questions.length - 1)
      : Math.max(session.currentQuestionIndex - 1, 0);
    
    setSession({
      ...session,
      currentQuestionIndex: newIndex
    });
    
    // Set selected answer for this question if already answered
    setSelectedAnswer(session.answers[newIndex] >= 0 ? session.answers[newIndex] : null);
    setShowResult(false);
  };
  
  // Handle finishing the game
  const handleFinishGame = async (answersOverride?: number[]) => {
    if (!session || !game || !user || gameCompleted || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Use the provided answers override if available, otherwise use session.answers
      const finalAnswers = answersOverride || session.answers;
      
      // Debug logs to help diagnose the issue
      console.log('Debug: session.answers before calculation:', finalAnswers);
      console.log('Debug: session.questions before calculation:', session.questions);
      
      // Calculate correct answers
      const correctAnswers = session.questions.reduce((count, question, index) => {
        const isCorrect = finalAnswers[index] === question.correct_answer;
        console.log(`Debug: Question ${index+1} - User answer: ${finalAnswers[index]}, Correct answer: ${question.correct_answer}, Is correct: ${isCorrect}`);
        return count + (isCorrect ? 1 : 0);
      }, 0);
      
      console.log('Debug: Calculated correctAnswers:', correctAnswers);
      
      // Submit game results
      const { data, error } = await RewardService.submitTriviaGame(
        user.id,
        session.gameId,
        finalAnswers,
        correctAnswers
      );
      
      console.log('Debug: submitTriviaGame response:', { data, error });
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        setGameCompleted(true);
        setGameResults({
          score: data.score,
          pointsEarned: data.pointsEarned,
          correctAnswers,
          totalQuestions: session.questions.length
        });
        
        successToast(data.message);
        
        // Update session with end time
        setSession({
          ...session,
          endTime: new Date(),
          score: data.score,
          pointsEarned: data.pointsEarned
        });
      }
    } catch (err) {
      errorToast('Failed to submit game results');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = session 
    ? ((session.currentQuestionIndex + 1) / session.questions.length) * 100 
    : 0;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trivia game...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
          <AlertTriangle className="h-16 w-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Game</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/trivia')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Back to Trivia</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!game || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h2>
          <p className="text-gray-600 mb-6">The trivia game you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/trivia')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Trivia
          </button>
        </div>
      </div>
    );
  }
  
  // Game completed screen
  if (gameCompleted && gameResults) {
    // Calculate time taken in minutes and seconds
    const timeTakenInSeconds = session.endTime && session.startTime 
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : game.estimated_time_minutes * 60;
    
    const minutes = Math.floor(timeTakenInSeconds / 60);
    const seconds = timeTakenInSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    console.log('Debug: Game completed with results:', gameResults);
    console.log('Debug: Time taken:', { timeTakenInSeconds, minutes, seconds, formattedTime });
    
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-8">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Completed!</h1>
              <p className="text-gray-600">
                You've completed the {game.title} trivia challenge.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Your Score</p>
                  <p className="text-3xl font-bold text-primary-600">{gameResults.score}%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Points Earned</p>
                  <p className="text-3xl font-bold text-secondary-600">+{gameResults.pointsEarned}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Correct Answers</p>
                  <p className="text-3xl font-bold text-success-600">{gameResults.correctAnswers}/{gameResults.totalQuestions}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Time Taken</p>
                  <p className="text-3xl font-bold text-accent-600">
                    {formattedTime} min
                  </p>
                </div>
              </div>
            </div>
            
            {/* Share achievement button */}
            <div className="mb-8 flex justify-center">
              <ShareAchievementButton
                title={game.title}
                score={gameResults.score}
                pointsEarned={gameResults.pointsEarned}
                gameLink={window.location.href}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/trivia')}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Back to Trivia</span>
              </button>
              <button
                onClick={() => {
                  // Reset the game and start over
                  setSession({
                    ...session,
                    currentQuestionIndex: 0,
                    answers: Array(session.questions.length).fill(-1),
                    startTime: new Date(),
                    endTime: undefined,
                    score: undefined,
                    pointsEarned: undefined
                  });
                  setSelectedAnswer(null);
                  setShowResult(false);
                  setGameCompleted(false);
                  setGameResults(null);
                  setTimeRemaining(game.estimated_time_minutes * 60);
                }}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors flex items-center justify-center space-x-2"
              >
                <Brain className="h-5 w-5" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Game Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded-md text-xs font-medium">
                  {game.category}
                </span>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  game.difficulty === 'easy' 
                    ? 'bg-success-100 text-success-700' 
                    : game.difficulty === 'medium'
                    ? 'bg-warning-100 text-warning-700'
                    : 'bg-error-100 text-error-700'
                }`}>
                  {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{game.title}</h1>
              {game.description && (
                <p className="text-gray-600 text-sm">{game.description}</p>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                <p className={`text-lg font-bold ${
                  timeRemaining < 60 ? 'text-error-600 animate-pulse' : 'text-gray-900'
                }`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Reward</p>
                <p className="text-lg font-bold text-accent-600">+{game.points_reward} pts</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Question {session.currentQuestionIndex + 1} of {session.questions.length}
            </p>
            <p className="text-sm font-medium text-gray-700">
              {Math.round(progressPercentage)}% Complete
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question Card */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-6">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {currentQuestion?.question}
            </h2>
          </div>
          
          {/* Options */}
          <div className="space-y-4 mb-8">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showResult || isSubmitting}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  showResult
                    ? index === currentQuestion.correct_answer
                      ? 'border-success-500 bg-success-50'
                      : selectedAnswer === index
                      ? 'border-error-500 bg-error-50'
                      : 'opacity-60'
                    : ''
                } ${
                  showResult || isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    selectedAnswer === index
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700'
                  } ${
                    showResult
                      ? index === currentQuestion.correct_answer
                        ? 'bg-success-100 text-success-700'
                        : selectedAnswer === index
                        ? 'bg-error-100 text-error-700'
                        : ''
                      : ''
                  }`}>
                    {String.fromCharCode(65 + index)} {/* A, B, C, D, etc. */}
                  </div>
                  <span className="text-gray-900 font-medium">{option}</span>
                  
                  {/* Show check/x icons when showing result */}
                  {showResult && (
                    <div className="ml-auto">
                      {index === currentQuestion.correct_answer ? (
                        <CheckCircle className="h-6 w-6 text-success-500" />
                      ) : selectedAnswer === index ? (
                        <XCircle className="h-6 w-6 text-error-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => handleNavigate('prev')}
              disabled={session.currentQuestionIndex === 0 || showResult || isSubmitting}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                session.currentQuestionIndex === 0 || showResult || isSubmitting
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            {showResult ? (
              <div className="text-center">
                {isCorrect ? (
                  <p className="text-success-600 font-medium">Correct!</p>
                ) : (
                  <p className="text-error-600 font-medium">Incorrect!</p>
                )}
              </div>
            ) : selectedAnswer !== null ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <div></div> // Empty div to maintain layout
            )}
            
            {session.currentQuestionIndex < session.questions.length - 1 ? (
              <button
                onClick={() => handleNavigate('next')}
                disabled={showResult || isSubmitting}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  showResult || isSubmitting
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleFinishGame()}
                disabled={session.answers.includes(-1) || showResult || isSubmitting}
                className={`px-6 py-2 rounded-lg ${
                  session.answers.includes(-1) || showResult || isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:from-success-700 hover:to-success-800'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Finish Game'}
              </button>
            )}
          </div>
        </div>
        
        {/* Question Navigation */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-2 justify-center">
            {session.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!showResult && !isSubmitting) {
                    setSession({
                      ...session,
                      currentQuestionIndex: index
                    });
                    setSelectedAnswer(session.answers[index] >= 0 ? session.answers[index] : null);
                  }
                }}
                disabled={showResult || isSubmitting}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index === session.currentQuestionIndex
                    ? 'bg-primary-600 text-white'
                    : session.answers[index] >= 0
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${
                  showResult || isSubmitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};