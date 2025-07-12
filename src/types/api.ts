/**
 * API Types
 * 
 * This file contains type definitions for API responses and requests.
 * When migrating to a Node.js backend, these types will help ensure
 * consistency between frontend and backend data structures.
 */

// Base API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination structure
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Profile-related types
export interface ProfileUpdateRequest {
  name?: string;
  country?: string;
  avatar_url?: string;
  payout_method?: string;
  paypal_email?: string;
  bank_details?: Record<string, any>;
  currency?: string;
}

export interface PointsUpdateRequest {
  points: number;
  reason?: string;
}

export interface BadgeAddRequest {
  badge: string;
  reason?: string;
}

// Authentication types
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token?: string;
  refreshToken?: string;
}

// Future API types for other modules
export interface PollCreateRequest {
  title: string;
  description?: string;
  options: string[];
  type?: 'global' | 'country';
  country?: string;
  category: string;
  start_date?: string;
  active_until?: string;
}

export interface TriviaGameRequest {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

export interface RewardClaimRequest {
  rewardId: string;
  type: 'daily' | 'achievement' | 'store';
}

// Daily Rewards types
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  country?: string;
  is_active: boolean;
  created_at: string;
}

export interface SpinResult {
  success: boolean;
  points: number;
  message: string;
  type: 'points' | 'try_again';
}

export interface DailyRewardStatus {
  canSpin: boolean;
  canPlayTrivia: boolean;
  canWatchAd: boolean;
  lastSpinDate?: string;
  lastTriviaDate?: string;
  lastWatchDate?: string;
  triviaStreak: number;
  spinStreak: number;
  totalSpins: number;
  totalTriviaCompleted: number;
  totalAdsWatched: number;
}

export interface TriviaSubmission {
  questionId: string;
  selectedAnswer: number;
}

export interface TriviaResult {
  correct: boolean;
  correctAnswer: number;
  pointsEarned: number;
  streakBonus: number;
  newStreak: number;
  title?: string;
  description?: string;
}

export interface TriviaGame {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_ids: string[];
  number_of_questions: number;
  points_reward: number;
  estimated_time_minutes: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

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
  hasPlayed?: boolean;
}

export interface TriviaGameSession {
  gameId: string;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  answers: number[];
  startTime: Date;
  endTime?: Date;
  score?: number;
  pointsEarned?: number;
}

export interface AdWatchResult {
  success: boolean;
  pointsEarned: number;
  message: string;
}

export interface DailyRewardHistory {
  id: string;
  user_id: string;
  reward_type: 'spin' | 'trivia' | 'watch';
  points_earned: number;
  reward_data: Record<string, any>;
  created_at: string;
}

// Polls System Types
export interface PollOption {
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  type: 'global' | 'country';
  country?: string;
  slug: string;
  created_by: string;
  start_date?: string;
  active_until?: string;
  is_active: boolean;
  total_votes: number;
  created_at: string;
  updated_at: string;
  hasVoted?: boolean;
  userVote?: number;
  timeLeft?: string;
  category: string;
  reward?: number;
}

export interface PollCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PollVote {
  id: string;
  user_id: string;
  poll_id: string;
  vote_option: number;
  created_at: string;
}

export interface PollVoteRequest {
  poll_id: string;
  vote_option: number;
}

export interface PollVoteResult {
  success: boolean;
  message: string;
  pointsEarned?: number;
  poll?: Poll;
}

// Badge System Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  criteria: BadgeCriteria;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BadgeCriteria {
  type: string;
  count?: number;
  difficulty?: string;
  before?: string;
  [key: string]: any;
}

export interface UserBadgeProgress {
  badge: Badge;
  earned: boolean;
  progress: number;
  maxProgress: number;
  earnedAt?: string;
}

export interface BadgeCreateRequest {
  name: string;
  description: string;
  icon_url?: string;
  criteria: BadgeCriteria;
}

export interface BadgeUpdateRequest {
  name?: string;
  description?: string;
  icon_url?: string;
  criteria?: BadgeCriteria;
  is_active?: boolean;
}

// Community Roles Types
export interface ModeratorAction {
  id: string;
  moderator_id: string;
  action_type: string;
  target_id: string;
  target_table: string;
  reason?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AmbassadorDetails {
  id: string;
  user_id: string;
  country: string;
  commission_rate: number;
  is_active: boolean;
  total_referrals: number;
  total_earnings: number;
  total_payouts: number;
  created_at: string;
  updated_at: string;
}

export interface CountryMetric {
  id: string;
  country: string;
  metric_date: string;
  ad_revenue: number;
  user_count: number;
  new_users: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface ModeratorActionRequest {
  action_type: string;
  target_id: string;
  target_table: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface AmbassadorStats {
  totalReferrals: number;
  totalEarnings: number;
  monthlyEarnings: number;
  conversionRate: number;
  countryRank: number;
  tierName?: string;
  nextTierName?: string;
  referralsToNextTier?: number;
  payableBalance?: number;
}

// Poll Comments Types
export interface PollComment {
  id: string;
  poll_id: string;
  user_id: string;
  comment_text: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  user?: {
    name: string;
    avatar_url?: string;
  };
  replies?: PollComment[];
}

export interface PollCommentCreateRequest {
  poll_id: string;
  comment_text: string;
  parent_comment_id?: string;
}

// Content Reporting Types
export interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: 'poll' | 'comment';
  content_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
  resolved_by?: string;
  resolution_notes?: string;
  reporter?: {
    name: string;
    email: string;
  };
  resolver?: {
    name: string;
    email: string;
  };
}

export interface ContentReportCreateRequest {
  content_type: 'poll' | 'comment';
  content_id: string;
  reason: string;
}

// Reward Store Types
export interface RedeemItemRequest {
  itemId: string;
  itemName: string;
  pointsCost: number;
  fulfillmentDetails?: Record<string, any>;
}

export interface RedeemItemResult {
  success: boolean;
  message: string;
  newPointsBalance?: number;
  redeemedItemId?: string;
}

export interface RedeemedItem {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  points_cost: number;
  status: 'pending_fulfillment' | 'fulfilled' | 'cancelled';
  fulfillment_details?: Record<string, any>;
  redeemed_at: string;
  updated_at: string;
  currency?: string;
  original_currency?: string;
  original_points_cost?: number;
}

// Reward Store Items Types
export interface RewardStoreItem {
  id: string;
  name: string;
  description?: string;
  item_type: 'gift_card' | 'subscription_code' | 'paypal_payout' | 'bank_transfer' | 'physical_item';
  points_cost: number;
  value?: string;
  currency?: string;
  image_url?: string;
  fulfillment_instructions?: string;
  is_active: boolean;
  stock_quantity?: number;
  created_at: string;
  updated_at: string;
  original_currency?: string;
  original_points_cost?: number;
}

// Commission Tier Types
export interface CommissionTier {
  id: string;
  name: string;
  min_referrals: number;
  global_rate: number;
  country_rates: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Payout System Types
export interface PayoutMethod {
  id: string;
  name: string;
  description?: string;
  is_automatic: boolean;
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  payout_method: string;
  payout_details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  currency?: string;
}

export interface PayoutRequestCreateRequest {
  amount: number;
  payout_method: string;
  payout_details?: Record<string, any>;
  currency?: string;
}

export interface PayoutRequestUpdateRequest {
  status: 'approved' | 'rejected' | 'processed';
  admin_notes?: string;
  transaction_id?: string;
}

export interface PayoutMethodCreateRequest {
  name: string;
  description?: string;
  is_automatic: boolean;
  config: Record<string, any>;
}

export interface PayoutMethodUpdateRequest {
  name?: string;
  description?: string;
  is_automatic?: boolean;
  is_active?: boolean;
  config?: Record<string, any>;
}

// Marketing Materials Types
export interface MarketingMaterial {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_path: string;
  file_type: string;
  material_type: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketingMaterialCreateRequest {
  name: string;
  description?: string;
  material_type: string;
  file_type: string;
}

export interface MarketingMaterialUpdateRequest {
  name?: string;
  description?: string;
  material_type?: string;
  is_active?: boolean;
}

// Promoted Polls Types
export interface Sponsor {
  id: string;
  user_id: string;
  name: string;
  contact_email: string;
  website_url?: string;
  description?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SponsorCreateRequest {
  name: string;
  contact_email: string;
  website_url?: string;
  description?: string;
}

export interface SponsorUpdateRequest {
  name?: string;
  contact_email?: string;
  website_url?: string;
  description?: string;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface PromotedPoll {
  id: string;
  poll_id: string;
  sponsor_id: string;
  pricing_model: 'CPV'; // Cost Per Vote
  budget_amount: number;
  cost_per_vote: number;
  target_votes: number;
  current_votes: number;
  status: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  admin_notes?: string;
  poll?: Poll;
  sponsor?: Sponsor;
}

export interface PromotedPollCreateRequest {
  poll_id: string;
  sponsor_id: string;
  budget_amount: number;
  target_votes: number;
  start_date?: string;
  end_date?: string;
  currency?: string;
}

export interface PromotedPollUpdateRequest {
  status?: 'pending_approval' | 'active' | 'paused' | 'completed' | 'rejected';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  budget_amount?: number;
  target_votes?: number;
  start_date?: string;
  end_date?: string;
  admin_notes?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  promoted_poll_id?: string;
  amount: number;
  currency: string;
  original_amount?: number;
  original_currency?: string;
  payment_method: 'wallet' | 'stripe' | 'paypal' | 'paystack';
  payment_method_id?: string;
  gateway_transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  stripe_payment_intent_id?: string;
  stripe_payment_method_id?: string;
  stripe_customer_id?: string;
}

export interface TransactionCreateRequest {
  promoted_poll_id?: string;
  amount: number;
  currency?: string;
  payment_method: 'wallet' | 'stripe' | 'paypal' | 'paystack';
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  type: 'wallet' | 'stripe' | 'paypal' | 'paystack';
  is_active: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Currency and Exchange Rate Types
export interface CurrencyExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

export interface CountryCurrencySettings {
  id: string;
  country_code: string;
  enabled_currencies: string[];
  default_currency: string;
  updated_at: string;
}

export interface PaymentGatewaySettings {
  default_gateways: string[];
  country_gateways: Record<string, string[]>;
}