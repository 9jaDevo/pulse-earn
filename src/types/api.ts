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
  description: string;
  options: string[];
  category: string;
  duration: number; // in hours
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
}

export interface ContentReportCreateRequest {
  content_type: 'poll' | 'comment';
  content_id: string;
  reason: string;
}