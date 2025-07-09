import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Calendar, 
  Trophy, 
  Clock, 
  Star, 
  Zap, 
  Check,
  Lock,
  TrendingUp,
  Target,
  RotateCcw,
  Brain,
  Play,
  Tv,
  Award,
  ShoppingBag,
  Package,
  Info,
  AlertCircle,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../hooks/useRewards';
import { useBadges } from '../hooks/useBadges';
import { useCountdown, getNextMidnightUTC } from '../hooks/useCountdown';
import type { TriviaQuestion, TriviaResult, RedeemItemRequest, RewardStoreItem } from '../types/api';
import { ContentAd } from '../components/ads/ContentAd';
import { SpinWinModal } from '../components/rewards/SpinWinModal';
import { useToast } from '../hooks/useToast';
import getSymbolFromCurrency from 'currency-symbol-map';

export const RewardsPage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const { status, loading, performSpin, getTriviaQuestion, submitTriviaAnswer, watchAd, redeemStoreItem, redeemedItems, fetchRedeemedItems, getRewardStoreItems } = useRewards(user?.id);
  const { userProgress, loading: badgesLoading, error: badgesError } = useBadges(user?.id);
  const countdown = useCountdown(React.useMemo(() => getNextMidnightUTC(), []));
  const { successToast, errorToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'daily' | 'achievements' | 'store' | 'history'>('daily');
  const [spinLoading, setSpinLoading] = useState(false);
  const [showSpinWinModal, setShowSpinWinModal] = useState(false);
  const [triviaQuestion, setTriviaQuestion] = useState<TriviaQuestion | null>(null);
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [triviaResult, setTriviaResult] = useState<TriviaResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [adResult, setAdResult] = useState<any>(null);
  const [redeemingItem, setRedeemingItem] = useState<string | null>(null);
  const [storeItems, setStoreItems] = useState<RewardStoreItem[]>([]);
  const [storeItemsLoading, setStoreItemsLoading] = useState(false);
  const [storeItemsError, setStoreItemsError] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  // Set initial currency from user profile
  useEffect(() => {
    if (profile?.currency) {
      setSelectedCurrency(profile.currency);
    }
  }, [profile]);

  // Fetch store items when component mounts or when filter changes
  useEffect(() => {
    const fetchStoreItems = async () => {
      setStoreItemsLoading(true);
      setStoreItemsError(null);
      
      try {
        const options: any = {
          inStock: true,
          currency: selectedCurrency
        };
        
        if (selectedItemType !== 'all') {
          options.itemType = selectedItemType;
        }
        
        const { data, error } = await getRewardStoreItems(options);
        
        if (error) {
          setStoreItemsError(error);
          errorToast(`Failed to load reward items: ${error}`);
        } else {
          setStoreItems(data || []);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setStoreItemsError(errorMessage);
        errorToast(`Error: ${errorMessage}`);
      } finally {
        setStoreItemsLoading(false);
      }
    };
    
    // Fetch supported currencies
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const { data, error } = await SettingsService.getSupportedCurrencies();
        if (error) {
          console.error('Error fetching currencies:', error);
        } else {
          setSupportedCurrencies(data || ['USD']);
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    
    if (activeTab === 'store') {
      fetchStoreItems();
      fetchCurrencies();
    }
  }, [activeTab, selectedItemType, selectedCurrency]);

  const handleSpin = async () => {
    setSpinLoading(true);
    setSpinResult(null);
    
    const result = await performSpin();
    
    if (result.success && result.result) {
      setSpinResult(result.result);
    }
    
    setSpinLoading(false);
  };

  const handleStartTrivia = async () => {
    setTriviaLoading(true);
    setTriviaQuestion(null);
    setTriviaResult(null);
    setSelectedAnswer(null);
    
    const result = await getTriviaQuestion(profile?.country);
    
    if (result.success && result.question) {
      setTriviaQuestion(result.question);
    }
    
    setTriviaLoading(false);
  };

  const handleSubmitTrivia = async () => {
    if (!triviaQuestion || selectedAnswer === null) return;
    
    setTriviaLoading(true);
    
    const result = await submitTriviaAnswer({
      questionId: triviaQuestion.id,
      selectedAnswer
    });
    
    if (result.success && result.result) {
      setTriviaResult(result.result);
    }
    
    setTriviaLoading(false);
  };

  const handleWatchAd = async () => {
    setAdLoading(true);
    setAdResult(null);
    
    // Simulate ad watching delay
    setTimeout(async () => {
      const result = await watchAd();
      
      if (result.success && result.result) {
        setAdResult(result.result);
      }
      
      setAdLoading(false);
    }, 3000); // 3 second simulated ad
  };

  const handleRedeem = async (item: RewardStoreItem) => {
    if (!user || !profile) {
      errorToast('Please sign in to redeem items.');
      return;
    }
    
    // Calculate points cost in user's preferred currency
    let pointsCost = item.points_cost;
    
    // If the item has an original currency and it's different from the selected currency,
    // use the original points cost
    if (item.original_currency && item.original_currency !== selectedCurrency && item.original_points_cost) {
      pointsCost = item.original_points_cost;
    }
    
    if (profile.points < pointsCost) {
      errorToast('You do not have enough points to redeem this item.');
      return;
    }
    
    // Check if item is out of stock
    if (item.stock_quantity !== null && item.stock_quantity <= 0) {
      errorToast('This item is currently out of stock.');
      return;
    }
    
    setRedeemingItem(item.id);
    
    try {
      // Prepare additional details based on item type
      const fulfillmentDetails: Record<string, any> = {
        redeemedBy: profile.name || user.email,
        redeemedAt: new Date().toISOString(),
        itemType: item.item_type,
        currency: item.currency || selectedCurrency
      };
      
      // For physical items, we'll need shipping address later
      if (item.item_type === 'physical_item') {
        fulfillmentDetails.requiresShipping = true;
      }
      
      // For bank transfers, we'll need bank details later
      if (item.item_type === 'bank_transfer') {
        fulfillmentDetails.requiresBankDetails = true;
      }
      
      // For PayPal, ensure we have the email
      if (item.item_type === 'paypal_payout') {
        fulfillmentDetails.paypalEmail = profile.email;
      }
      
      const request: RedeemItemRequest = {
        itemId: item.id,
        itemName: item.name,
        pointsCost: pointsCost,
        fulfillmentDetails
      };
      
      const result = await redeemStoreItem(request);
      
      if (result.success && result.result) {
        successToast(result.result.message);
        
        // Update local profile points to reflect the deduction
        if (result.result.newPointsBalance !== undefined && updateProfile) {
          updateProfile({ points: result.result.newPointsBalance });
        }
        
        // Refresh the store items to update stock
        const { data } = await getRewardStoreItems({
          inStock: true,
          itemType: selectedItemType !== 'all' ? selectedItemType : undefined,
          currency: selectedCurrency
        });
        
        if (data) {
          setStoreItems(data);
        }
      } else {
        errorToast(result.error || 'Failed to redeem item. Please try again.');
      }
    } catch (err) {
      errorToast('An unexpected error occurred during redemption.');
      console.error('Redemption error:', err);
    } finally {
      setRedeemingItem(null);
    }
  };

  const currentStreak = status?.triviaStreak || 0;
  const totalPoints = profile?.points || 0;

  const formatCountdownTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  // Get item type display name
  const getItemTypeDisplay = (type: string): string => {
    switch (type) {
      case 'gift_card': return 'Gift Cards';
      case 'subscription_code': return 'Subscriptions';
      case 'paypal_payout': return 'PayPal';
      case 'bank_transfer': return 'Bank Transfers';
      case 'physical_item': return 'Physical Items';
      default: return 'All Items';
    }
  };

  // Get item type icon
  const getItemTypeIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'gift_card': return <Gift className="h-4 w-4" />;
      case 'subscription_code': return <Play className="h-4 w-4" />;
      case 'paypal_payout': return <ShoppingBag className="h-4 w-4" />;
      case 'bank_transfer': return <Package className="h-4 w-4" />;
      case 'physical_item': return <Package className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string): string => {
    return getSymbolFromCurrency(currencyCode) || '$';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reward center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-accent-500 to-warning-500 p-4 rounded-2xl">
              <Gift className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rewards <span className="bg-gradient-to-r from-accent-600 to-warning-600 bg-clip-text text-transparent">Center</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Claim daily rewards, unlock achievements, and redeem your points for amazing prizes!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Available Points</p>
                <p className="text-3xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="bg-accent-100 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900">{currentStreak} days</p>
              </div>
              <div className="bg-success-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Badges Earned</p>
                <p className="text-3xl font-bold text-gray-900">{userProgress?.filter(bp => bp.earned).length || 0}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Trophy className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Reset Countdown */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Daily Rewards Reset</h3>
              <p className="text-primary-100">
                New daily rewards will be available in:
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">
                {formatCountdownTime(countdown.hours)}:{formatCountdownTime(countdown.minutes)}:{formatCountdownTime(countdown.seconds)}
              </div>
              <div className="text-primary-200 text-sm">Hours : Minutes : Seconds</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: 'daily', label: 'Daily Rewards', icon: Calendar },
              { key: 'achievements', label: 'Achievements', icon: Trophy },
              { key: 'store', label: 'Reward Store', icon: Gift },
              { key: 'history', label: 'Redemption History', icon: Package }
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

        {/* Daily Rewards Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-8">
            {/* Daily Reward Activities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Spin & Win */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RotateCcw className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Spin & Win</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Spin the wheel once per day for a chance to win points!
                  </p>
                  
                  {spinResult && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      spinResult.success ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                    }`}>
                      <p className="font-medium">{spinResult.message}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowSpinWinModal(true)}
                    disabled={!status?.canSpin || spinLoading}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      status?.canSpin && !spinLoading
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transform hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {status?.canSpin ? 'Open Spin Wheel' : 'Already Spun Today'}
                  </button>
                </div>
              </div>

              {/* Trivia Challenge */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Trivia Challenge</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Answer daily trivia questions and build your streak!
                  </p>
                  
                  {triviaResult && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      triviaResult.correct ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
                    }`}>
                      <p className="font-medium">
                        {triviaResult.correct ? 'Correct!' : 'Wrong answer'} 
                        {triviaResult.pointsEarned > 0 && ` +${triviaResult.pointsEarned} points`}
                      </p>
                      {triviaResult.streakBonus > 0 && (
                        <p className="text-sm">Streak bonus: +{triviaResult.streakBonus} points</p>
                      )}
                    </div>
                  )}
                  
                  {triviaQuestion ? (
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900 mb-3">{triviaQuestion.question}</h4>
                      <div className="space-y-2 mb-4">
                        {triviaQuestion.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAnswer(index)}
                            disabled={triviaResult !== null}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedAnswer === index
                                ? 'border-primary-300 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${triviaResult !== null ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      {!triviaResult && (
                        <button
                          onClick={handleSubmitTrivia}
                          disabled={selectedAnswer === null || triviaLoading}
                          className="w-full bg-secondary-600 text-white py-2 rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {triviaLoading ? 'Submitting...' : 'Submit Answer'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleStartTrivia}
                      disabled={!status?.canPlayTrivia || triviaLoading}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                        status?.canPlayTrivia && !triviaLoading
                          ? 'bg-gradient-to-r from-secondary-600 to-secondary-700 text-white hover:from-secondary-700 hover:to-secondary-800 transform hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {triviaLoading ? 'Loading...' : status?.canPlayTrivia ? 'Start Trivia' : 'Already Completed Today'}
                    </button>
                  )}
                </div>
              </div>

              {/* Watch & Win */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-accent-500 to-accent-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tv className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Watch & Win</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Watch a short ad and earn 15 points instantly!
                  </p>
                  
                  {adResult && (
                    <div className="bg-success-50 text-success-700 p-3 rounded-lg mb-4">
                      <p className="font-medium">{adResult.message}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleWatchAd}
                    disabled={!status?.canWatchAd || adLoading}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      status?.canWatchAd && !adLoading
                        ? 'bg-gradient-to-r from-accent-600 to-accent-700 text-white hover:from-accent-700 hover:to-accent-800 transform hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {adLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Play className="h-4 w-4 animate-pulse" />
                        <span>Watching Ad...</span>
                      </div>
                    ) : status?.canWatchAd ? 'Watch Ad' : 'Already Watched Today'}
                  </button>
                </div>
              </div>
            </div>

            {/* Streak Bonus */}
            {currentStreak > 0 && (
              <div className="bg-gradient-to-r from-success-600 to-success-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Streak Bonus Active!</h3>
                    <p className="text-success-100">
                      You're on a {currentStreak}-day streak! Keep it up for bonus multipliers.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">{Math.min(currentStreak * 0.1 + 1, 2).toFixed(1)}x</div>
                    <div className="text-success-200 text-sm">Multiplier</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Ad between sections */}
        {activeTab === 'daily' && (
          <ContentAd layout="in-article" className="my-8" />
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div>
            {badgesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading achievements...</p>
              </div>
            ) : badgesError ? (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
                {badgesError}
              </div>
            ) : userProgress && userProgress.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProgress.map((badgeProgress) => (
                  <div
                    key={badgeProgress.badge.id}
                    className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all ${
                      badgeProgress.earned
                        ? 'border-success-200 bg-success-50'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${
                          badgeProgress.earned ? 'bg-success-100' : 'bg-gray-100'
                        }`}>
                          <Award className={`h-6 w-6 ${
                            badgeProgress.earned ? 'text-success-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{badgeProgress.badge.name}</h3>
                          <p className="text-gray-600 text-sm">{badgeProgress.badge.description}</p>
                        </div>
                      </div>
                      {badgeProgress.earned && (
                        <Check className="h-6 w-6 text-success-500" />
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {badgeProgress.progress}/{badgeProgress.maxProgress}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            badgeProgress.earned
                              ? 'bg-success-500'
                              : 'bg-gradient-to-r from-primary-500 to-primary-600'
                          }`}
                          style={{ width: `${Math.min((badgeProgress.progress / badgeProgress.maxProgress) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-accent-600 font-semibold">Badge Reward</span>
                      {badgeProgress.earned ? (
                        <span className="text-success-600 text-sm font-medium">Completed ✓</span>
                      ) : (
                        <span className="text-gray-500 text-sm">In Progress</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                <p className="text-gray-600">
                  Start participating in polls and trivia to unlock your first achievements!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            {/* Currency and Item Type Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Currency Selector */}
                <div className="w-full md:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full md:w-auto pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    >
                      {loadingCurrencies ? (
                        <option value="USD">Loading currencies...</option>
                      ) : (
                        supportedCurrencies.map(curr => (
                          <option key={curr} value={curr}>
                            {curr} {getCurrencySymbol(curr)}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Item Type Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedItemType('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                        selectedItemType === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Gift className="h-4 w-4" />
                      <span>All Items</span>
                    </button>
                    {['gift_card', 'subscription_code', 'paypal_payout', 'bank_transfer', 'physical_item'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedItemType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                          selectedItemType === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {getItemTypeIcon(type)}
                        <span>{getItemTypeDisplay(type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {storeItemsLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading reward items...</p>
              </div>
            )}

            {/* Error State */}
            {storeItemsError && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Failed to load reward items</p>
                    <p className="text-sm">{storeItemsError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!storeItemsLoading && !storeItemsError && storeItems.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
                <p className="text-gray-600 mb-4">
                  {selectedItemType !== 'all' 
                    ? `No ${getItemTypeDisplay(selectedItemType).toLowerCase()} are currently available in ${selectedCurrency}.`
                    : `There are no items available in ${selectedCurrency} right now.`}
                </p>
                {selectedItemType !== 'all' && (
                  <button
                    onClick={() => setSelectedItemType('all')}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    View All Items
                  </button>
                )}
              </div>
            )}

            {/* Items Grid */}
            {!storeItemsLoading && !storeItemsError && storeItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeItems.map((item) => {
                  // Get the appropriate currency symbol
                  const itemCurrency = item.currency || selectedCurrency;
                  const itemSymbol = getCurrencySymbol(itemCurrency);
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-3">{item.image_url || '🎁'}</div>
                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs font-medium">
                          {getItemTypeDisplay(item.item_type)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{item.name}</h3>
                      <p className="text-center text-gray-600 mb-4">{item.value}</p>
                      
                      {item.description && (
                        <p className="text-sm text-gray-500 mb-4 text-center">{item.description}</p>
                      )}
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-primary-600">{item.points_cost.toLocaleString()}</span>
                        <span className="text-gray-600">points</span>
                      </div>
                      
                      {/* Show original currency if different */}
                      {item.original_currency && item.original_currency !== selectedCurrency && item.original_points_cost && (
                        <div className="text-xs text-gray-500 mb-4">
                          Original price: {item.original_points_cost.toLocaleString()} points in {item.original_currency} ({getCurrencySymbol(item.original_currency)})
                        </div>
                      )}
                      
                      {item.stock_quantity !== null && (
                        <div className="flex justify-between items-center mb-4 text-sm">
                          <span className="text-gray-500">Stock:</span>
                          <span className={`font-medium ${item.stock_quantity > 10 ? 'text-success-600' : item.stock_quantity > 0 ? 'text-warning-600' : 'text-error-600'}`}>
                            {item.stock_quantity > 0 ? `${item.stock_quantity} remaining` : 'Out of stock'}
                          </span>
                        </div>
                      )}
                      
                      {item.fulfillment_instructions && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 flex items-start space-x-2">
                          <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-500">{item.fulfillment_instructions}</p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRedeem(item)}
                        disabled={totalPoints < item.points_cost || redeemingItem === item.id || (item.stock_quantity !== null && item.stock_quantity <= 0)}
                        className={`w-full py-3 rounded-lg font-medium transition-all ${
                          totalPoints >= item.points_cost && redeemingItem !== item.id && (item.stock_quantity === null || item.stock_quantity > 0)
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transform hover:scale-105'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {redeemingItem === item.id
                          ? 'Processing...'
                          : item.stock_quantity !== null && item.stock_quantity <= 0
                          ? 'Out of Stock'
                          : totalPoints < item.points_cost
                          ? 'Insufficient Points'
                          : 'Redeem Now'
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Redemption History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary-600" />
              Your Redemption History
            </h2>
            
            {redeemedItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't redeemed any items from the store yet.
                </p>
                <button
                  onClick={() => setActiveTab('store')}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Reward Store
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Redeemed On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {redeemedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {item.item_id.includes('amazon') ? '🎁' : 
                               item.item_id.includes('netflix') ? '📺' : 
                               item.item_id.includes('spotify') ? '🎵' : 
                               item.item_id.includes('paypal') ? '💰' : 
                               item.item_id.includes('bank') ? '🏦' : 
                               item.item_id.includes('mouse') ? '🖱️' : 
                               item.item_id.includes('earbuds') ? '🎧' : 
                               item.item_id.includes('shirt') ? '👕' : '🏆'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                              <div className="text-sm text-gray-500">{item.item_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.points_cost.toLocaleString()}</div>
                          {item.currency && (
                            <div className="text-xs text-gray-500">
                              {item.currency} {getCurrencySymbol(item.currency)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'pending_fulfillment' ? 'bg-warning-100 text-warning-800' :
                            item.status === 'fulfilled' ? 'bg-success-100 text-success-800' :
                            'bg-error-100 text-error-800'
                          }`}>
                            {item.status === 'pending_fulfillment' ? 'Pending' :
                             item.status === 'fulfilled' ? 'Fulfilled' : 'Cancelled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.redeemed_at).toLocaleDateString()} {new Date(item.redeemed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spin & Win Modal */}
      <SpinWinModal
        isOpen={showSpinWinModal}
        onClose={() => setShowSpinWinModal(false)}
        status={status}
        performSpin={performSpin}
        spinResult={spinResult}
        setSpinResult={setSpinResult}
        spinLoading={spinLoading}
        setSpinLoading={setSpinLoading}
      />
    </div>
  );
};