import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Trophy, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

interface Contest {
  id: string;
  title: string;
  description: string;
  end_time: string;
  trivia_game_id: string;
  trivia_game?: {
    title: string;
    description: string;
  };
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

export function ContestGamePage() {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contest, setContest] = useState<Contest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (contestId && user) {
      checkPlayStatus();
      fetchContestData();
    }
  }, [contestId, user]);

  useEffect(() => {
    if (contest && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [contest, timeRemaining]);

  const checkPlayStatus = async () => {
    if (!user || !contestId) return;

    try {
      const { data, error } = await supabase.rpc('get_contest_play_status', {
        p_user_id: user.id,
        p_contest_id: contestId
      });

      if (error) throw error;
      setCanPlay(data);

      if (!data) {
        showToast('You are not eligible to play this contest', 'error');
        navigate('/trivia');
      }
    } catch (error) {
      console.error('Error checking play status:', error);
      showToast('Failed to verify contest eligibility', 'error');
      navigate('/trivia');
    }
  };

  const fetchContestData = async () => {
    if (!contestId) return;

    try {
      // Fetch contest details
      const { data: contestData, error: contestError } = await supabase
        .from('trivia_contests')
        .select(`
          *,
          trivia_game:trivia_games(title, description)
        `)
        .eq('id', contestId)
        .single();

      if (contestError) throw contestError;
      setContest(contestData);

      // Calculate time remaining
      const endTime = new Date(contestData.end_time).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('trivia_questions')
        .select('*')
        .eq('trivia_game_id', contestData.trivia_game_id)
        .eq('is_active', true);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
      setSelectedAnswers(new Array(questionsData?.length || 0).fill(-1));

    } catch (error) {
      console.error('Error fetching contest data:', error);
      showToast('Failed to load contest', 'error');
      navigate('/trivia');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitGame();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleTimeUp = () => {
    showToast('Time is up! Submitting your answers...', 'warning');
    handleSubmitGame();
  };

  const handleSubmitGame = async () => {
    if (!user || !contestId || gameCompleted) return;

    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correct_answer) {
          correctAnswers++;
        }
      });

      const finalScore = correctAnswers;
      setScore(finalScore);

      // Submit score
      const { error } = await supabase.rpc('submit_contest_score', {
        p_user_id: user.id,
        p_contest_id: contestId,
        p_score: finalScore
      });

      if (error) throw error;

      setGameCompleted(true);
      showToast(`Game completed! You scored ${finalScore}/${questions.length}`, 'success');

    } catch (error) {
      console.error('Error submitting score:', error);
      showToast('Failed to submit score', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canPlay || !contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-500">You are not eligible to play this contest.</p>
        </div>
      </div>
    );
  }

  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Contest Completed!</h2>
            <p className="mt-2 text-gray-600">
              You scored <span className="font-bold text-indigo-600">{score}</span> out of {questions.length}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Results will be announced after the contest ends.
            </p>
            <button
              onClick={() => navigate('/trivia')}
              className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Trivia
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contest.title}</h1>
              <p className="text-sm text-gray-600">{contest.trivia_game?.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className={`font-mono ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-indigo-500" />
                <span className="text-gray-700">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Question {currentQuestionIndex + 1}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <button
                onClick={handleNextQuestion}
                disabled={selectedAnswers[currentQuestionIndex] === -1}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}