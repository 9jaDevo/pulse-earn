import { supabase, Database } from '../lib/supabase';
import { ProfileService } from './profileService';
import type { ServiceResponse } from './profileService';
import type { Poll, PollOption, PollVote, PollCreateRequest, PollVoteRequest, PollVoteResult, PollCategory } from '../types/api';

type PollRow = Database['public']['Tables']['polls']['Row'];
type PollInsert = Database['public']['Tables']['polls']['Insert'];
type PollVoteRow = Database['public']['Tables']['poll_votes']['Row'];
type PollVoteInsert = Database['public']['Tables']['poll_votes']['Insert'];

/**
 * Poll Service
 * 
 * This service handles all poll-related operations including:
 * - Creating and managing polls
 * - Voting system with restrictions
 * - Real-time results and statistics
 * - Country-based and global polls
 * 
 * When migrating to Node.js backend, only this file needs to be updated
 * to make HTTP requests instead of direct Supabase calls.
 */
export class PollService {
  /**
   * Generate SEO-friendly slug from title
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Calculate time left for poll
   */
  private static calculateTimeLeft(startDate: string | null, activeUntil: string | null): string {
    const now = new Date();
    
    // Check if poll hasn't started yet
    if (startDate) {
      const startTime = new Date(startDate);
      if (now < startTime) {
        const diff = startTime.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
        return 'Starting soon';
      }
    }
    
    if (!activeUntil) return 'No expiration';
    
    const endTime = new Date(activeUntil);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Less than 1 hour left';
  }

  /**
   * Transform database row to Poll interface
   */
  private static transformPollRow(row: PollRow, userVote?: PollVoteRow): Poll {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      options: row.options as PollOption[],
      type: row.type,
      country: row.country || undefined,
      slug: row.slug,
      created_by: row.created_by,
      start_date: row.start_date || undefined,
      active_until: row.active_until || undefined,
      is_active: row.is_active,
      total_votes: row.total_votes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      hasVoted: !!userVote,
      userVote: userVote?.vote_option,
      timeLeft: this.calculateTimeLeft(row.start_date, row.active_until),
      category: row.category || 'General',
      reward: 50 // Base reward for voting
    };
  }

  /**
   * Get all distinct poll categories
   */
  static async getAllPollCategories(): Promise<ServiceResponse<PollCategory[]>> {
    try {
      // First try to get categories from the poll_categories table
      const { data, error } = await supabase
        .from('poll_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        // If there's an error (like table doesn't exist yet), fall back to distinct categories from polls
        console.warn('Error fetching from poll_categories, falling back to distinct poll categories:', error);
        return this.getDistinctPollCategories();
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error in getAllPollCategories:', err);
      // Fall back to distinct categories from polls
      return this.getDistinctPollCategories();
    }
  }

  /**
   * Create a new poll category
   */
  static async createPollCategory(
    name: string,
    description: string
  ): Promise<ServiceResponse<PollCategory>> {
    try {
      // adjust to your schema—here we assume a separate table "poll_categories"
      const { data, error } = await supabase
        .from('poll_categories')
        .insert({ name, description })
        .select('*')
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create category' };
    }
  }

  /**
   * Update a poll category
   */
  static async updatePollCategory(
    categoryId: string,
    updates: {
      name?: string;
      description?: string | null;
      is_active?: boolean;
    }
  ): Promise<ServiceResponse<PollCategory>> {
    try {
      const { data, error } = await supabase
        .from('poll_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to update category' 
      };
    }
  }
  
  /**
   * Fetch polls with optional filtering
   */
  static async fetchPolls(
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      type?: 'global' | 'country';
      country?: string;
      orderBy?: 'created_at' | 'total_votes' | 'active_until';
      order?: 'asc' | 'desc';
      includeExpired?: boolean;
    } = {}
  ): Promise<ServiceResponse<Poll[]>> {
    try {
      console.log('[PollService] Fetching polls with options:', options, 'for userId:', userId || 'none');
      const { 
        limit = 10,
        offset = 0,
        type, 
        country, 
        orderBy = 'created_at', 
        order = 'desc',
        includeExpired = false 
      } = options;

      let query = supabase
        .from('polls')
        .select('*')
        .eq('is_active', true);

      // Add offset for pagination
      if (offset > 0) {
        query = query.range(offset, offset + limit - 1);
      } else {
        query = query.limit(limit);
      }

      // Add ordering
      query = query.order(orderBy, { ascending: order === 'asc' });

      if (type) {
        query = query.eq('type', type);
      }

      if (country) {
        query = query.eq('country', country);
      }

      if (!includeExpired) {
        const now = new Date().toISOString();
        // Poll is active if:
        // 1. start_date is null or in the past
        // 2. active_until is null or in the future
        query = query
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`active_until.is.null,active_until.gt.${now}`);
      }

      const { data: polls, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Get user votes if userId provided
      let userVotes: PollVoteRow[] = [];
      if (userId && polls && polls.length > 0) {
        const pollIds = polls.map(poll => poll.id);
        const { data: votes } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('user_id', userId)
          .in('poll_id', pollIds);
        
        userVotes = votes || [];
      }

      // Transform polls with user vote information
      const transformedPolls = (polls || []).map(poll => {
        const userVote = userVotes.find(vote => vote.poll_id === poll.id);
        return this.transformPollRow(poll, userVote);
      });

      return { data: transformedPolls, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch polls'
      };
    }
  }

  /**
   * Fetch a single poll by ID or slug
   */
  static async fetchPollBySlug(
    slug: string,
    userId?: string
  ): Promise<ServiceResponse<Poll>> {
    console.log('[PollService] Fetching poll by slug:', slug, 'for userId:', userId || 'none');
    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[PollService] Poll fetch result:', { 
        success: !error,
        found: !!poll
      });

      if (error) {
        console.error('[PollService] Database error fetching poll:', error);
        return { data: null, error: error.message };
      }

      if (!poll) {
        console.log('[PollService] Poll not found, returning null data');
        return { data: null, error: null };
      }

      // Get user vote if userId provided
      let userVote: PollVoteRow | undefined;
      if (userId) {
        console.log('[PollService] Fetching user vote for poll');
        const { data: vote } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('user_id', userId)
          .eq('poll_id', poll.id)
          .maybeSingle();
        
        console.log('[PollService] User vote fetch result:', { hasVote: !!vote });
        userVote = vote || undefined;
      }

      const transformedPoll = this.transformPollRow(poll, userVote);

      return { data: transformedPoll, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch poll'
      };
    }
  }

  /**
   * Create a new poll
   */
  static async createPoll(
    userId: string,
    pollData: PollCreateRequest
  ): Promise<ServiceResponse<Poll>> {
    try {
      // Generate slug
      const baseSlug = this.generateSlug(pollData.title);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique
      while (true) {
        const { data: existing } = await supabase
          .from('polls')
          .select('id')
          .eq('slug', slug)
          .limit(1)
          .single();

        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Transform options to include vote counts
      const options: PollOption[] = pollData.options.map(text => ({
        text,
        votes: 0
      }));

      const pollInsert: PollInsert = {
        title: pollData.title,
        description: pollData.description,
        options: options as any,
        type: pollData.type || 'global',
        country: pollData.type === 'country' ? pollData.country : null,
        category: pollData.category,
        start_date: pollData.start_date,
        slug,
        created_by: userId,
        active_until: pollData.active_until
      };

      const { data: poll, error } = await supabase
        .from('polls')
        .insert(pollInsert)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const transformedPoll = this.transformPollRow(poll);

      return { data: transformedPoll, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create poll'
      };
    }
  }

  /**
   * Vote on a poll
   */
  static async voteOnPoll(
    userId: string,
    voteData: PollVoteRequest
  ): Promise<ServiceResponse<PollVoteResult>> {
    console.log('[PollService] Voting on poll:', voteData.poll_id, 'option:', voteData.vote_option, 'by user:', userId);
    try {
      // Check if poll exists and is active
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', voteData.poll_id)
        .eq('is_active', true)
        .single();

      console.log('[PollService] Poll fetch for voting result:', { 
        success: !pollError, 
        found: !!poll
      });

      if (pollError) {
        return { data: null, error: 'Poll not found or inactive' };
      }

      // Check if poll is still active (not expired)
      if (poll.active_until && new Date(poll.active_until) < new Date()) {
        return { data: null, error: 'Poll has expired' };
        console.log('[PollService] Poll has expired');
      }
      
      // Check if poll has started
      if (poll.start_date && new Date(poll.start_date) > new Date()) {
        return { data: null, error: 'Poll has not started yet' };
      }

      // Validate vote option
      const options = poll.options as PollOption[];
      if (voteData.vote_option < 0 || voteData.vote_option >= options.length) {
        return { data: null, error: 'Invalid vote option' };
      }

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('user_id', userId)
        .eq('poll_id', voteData.poll_id)
        .maybeSingle();

      console.log('[PollService] Checking for existing vote:', { hasVoted: !!existingVote });
      if (existingVote) {
        return { data: null, error: 'You have already voted on this poll' };
      }

      // Insert vote
      const voteInsert: PollVoteInsert = {
        user_id: userId,
        poll_id: voteData.poll_id,
        vote_option: voteData.vote_option
      };

      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert(voteInsert);

      console.log('[PollService] Vote insert result:', { success: !voteError });
      if (voteError) {
        return { data: null, error: voteError.message };
      }

      // Update poll options with new vote count
      const updatedOptions = [...options];
      updatedOptions[voteData.vote_option].votes += 1;

      const { error: updateError } = await supabase
        .from('polls')
        .update({ 
          options: updatedOptions as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', voteData.poll_id);

      console.log('[PollService] Poll update result:', { success: !updateError });
      if (updateError) {
        return { data: null, error: updateError.message };
      }

      // Award points to user
      const pointsEarned = 50; // Base voting reward
      await ProfileService.updateUserPoints(userId, pointsEarned);
      console.log('[PollService] Points awarded to user:', pointsEarned);

      // Fetch updated poll
      const { data: updatedPoll } = await this.fetchPollBySlug(poll.slug, userId);
      console.log('[PollService] Updated poll fetched:', { success: !!updatedPoll });

      const result: PollVoteResult = {
        success: true,
        message: `Vote recorded successfully! You earned ${pointsEarned} points.`,
        pointsEarned,
        poll: updatedPoll || undefined
      };

      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to vote on poll'
      };
    }
  }

  /**
   * Update an existing poll
   */
  static async updatePoll(
    userId: string,
    pollId: string,
    updates: Partial<PollInsert>
  ): Promise<ServiceResponse<Poll>> {
    try {
      // First check if user is authorized to update this poll
      const { data: poll, error: fetchError } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      // Check if user is the creator or an admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = profile?.role === 'admin';
      const isCreator = poll.created_by === userId;

      if (!isAdmin && !isCreator) {
        return { data: null, error: 'You are not authorized to update this poll' };
      }

      // Prepare updates
      const updateData: Partial<PollInsert> = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // If options are being updated, ensure vote counts are preserved
      if (updates.options && Array.isArray(updates.options)) {
        const currentOptions = poll.options as PollOption[];
        const newOptionsRaw = updates.options as any[];
        
        // Convert new options to proper format with text property
        const newOptions = newOptionsRaw.map(option => 
          typeof option === 'string' ? { text: option } : option
        );
        
        // Create a map of current options with their vote counts
        const optionVotesMap = new Map<string, number>();
        currentOptions.forEach(option => {
          optionVotesMap.set(option.text.toLowerCase(), option.votes || 0);
        });
        
        // Preserve vote counts for existing options, set 0 for new ones
        updateData.options = newOptions.map(option => ({
          text: option.text,
          votes: optionVotesMap.get(option.text.toLowerCase()) || 0
        }));
      }

      // Update the poll
      const { data: updatedPoll, error: updateError } = await supabase
        .from('polls')
        .update(updateData)
        .eq('id', pollId)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      const transformedPoll = this.transformPollRow(updatedPoll);

      return { data: transformedPoll, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update poll'
      };
    }
  }

  /**
   * Archive a poll (soft delete)
   */
  static async archivePoll(
    userId: string,
    pollId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Call the archive_poll function
      const { data, error } = await supabase
        .rpc('archive_poll', {
          p_poll_id: pollId,
          p_user_id: userId
        });

      if (error) {
        console.error('Error archiving poll:', error);
        return { data: null, error: error.message };
      }

      console.log(`Successfully archived poll ${pollId}`);
      return { data: true, error: null };
    } catch (error) {
      console.error('Exception in archivePoll:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to archive poll'
      };
    }
  }

  /**
   * Restore an archived poll
   */
  static async restorePoll(
    userId: string,
    pollId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Call the restore_poll function
      const { data, error } = await supabase
        .rpc('restore_poll', {
          p_poll_id: pollId,
          p_user_id: userId
        });

      if (error) {
        console.error('Error restoring poll:', error);
        return { data: null, error: error.message };
      }

      console.log(`Successfully restored poll ${pollId}`);
      return { data: true, error: null };
    } catch (error) {
      console.error('Exception in restorePoll:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to restore poll'
      };
    }
  }

  /**
   * Get poll comments
   */
  static async getPollComments(
    pollId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ServiceResponse<PollComment[]>> {
    try {
      const { limit = 50, offset = 0 } = options;

      // First get top-level comments (no parent_comment_id)
      const { data: comments, error } = await supabase
        .from('poll_comments')
        .select(`
          *,
          user:profiles(name, avatar_url)
        `)
        .eq('poll_id', pollId)
        .is('parent_comment_id', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error: error.message };
      }

      // For each top-level comment, get its replies
      const commentsWithReplies = await Promise.all((comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('poll_comments')
          .select(`
            *,
            user:profiles(name, avatar_url)
          `)
          .eq('parent_comment_id', comment.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: replies || []
        };
      }));

      return { data: commentsWithReplies, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get poll comments'
      };
    }
  }

  /**
   * Create a poll comment
   */
  static async createPollComment(
    userId: string,
    commentData: PollCommentCreateRequest
  ): Promise<ServiceResponse<PollComment>> {
    try {
      const { data, error } = await supabase
        .from('poll_comments')
        .insert({
          poll_id: commentData.poll_id,
          user_id: userId,
          comment_text: commentData.comment_text,
          parent_comment_id: commentData.parent_comment_id || null
        })
        .select(`
          *,
          user:profiles(name, avatar_url)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create comment'
      };
    }
  }

  /**
   * Update a poll comment
   */
  static async updatePollComment(
    userId: string,
    commentId: string,
    commentText: string
  ): Promise<ServiceResponse<PollComment>> {
    try {
      // First check if user is authorized to update this comment
      const { data: comment, error: fetchError } = await supabase
        .from('poll_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (comment.user_id !== userId) {
        // Check if user is admin or moderator
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
          return { data: null, error: 'You are not authorized to update this comment' };
        }
      }

      // Update the comment
      const { data, error } = await supabase
        .from('poll_comments')
        .update({
          comment_text: commentText,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          user:profiles(name, avatar_url)
        `)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update comment'
      };
    }
  }

  /**
   * Delete a poll comment (soft delete)
   */
  static async deletePollComment(
    userId: string,
    commentId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      // First check if user is authorized to delete this comment
      const { data: comment, error: fetchError } = await supabase
        .from('poll_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      if (comment.user_id !== userId) {
        // Check if user is admin or moderator
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
          return { data: null, error: 'You are not authorized to delete this comment' };
        }
      }

      // Soft delete the comment by setting is_active to false
      const { error } = await supabase
        .from('poll_comments')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete comment'
      };
    }
  }

  /**
   * Report content (poll or comment)
   */
  static async reportContent(
    userId: string,
    reportData: ContentReportCreateRequest
  ): Promise<ServiceResponse<boolean>> {
    try {
      // Check if content exists
      let contentExists = false;
      
      if (reportData.content_type === 'poll') {
        const { count } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('id', reportData.content_id);
        
        contentExists = count !== null && count > 0;
      } else if (reportData.content_type === 'comment') {
        const { count } = await supabase
          .from('poll_comments')
          .select('*', { count: 'exact', head: true })
          .eq('id', reportData.content_id);
        
        contentExists = count !== null && count > 0;
      }
      
      if (!contentExists) {
        return { data: null, error: `${reportData.content_type} not found` };
      }

      // Create the report
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: userId,
          content_type: reportData.content_type,
          content_id: reportData.content_id,
          reason: reportData.reason,
          status: 'pending'
        });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    }
    catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to report content'
      };
    }
  }

  /**
   * Get user's poll history
   */
   static async getUserPollHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      includeCreated?: boolean;
      includeVoted?: boolean;
    } = {}
  ): Promise<ServiceResponse<{
    createdPolls: Poll[];
    votedPolls: Poll[];
  }>> {
    try {
      const { limit = 10, offset = 0, includeCreated = true, includeVoted = true } = options;

      let createdPolls: Poll[] = [];
      let votedPolls: Poll[] = [];

      if (includeCreated) {
        const { data: created } = await supabase
          .from('polls')
          .select('*')
          .eq('created_by', userId)
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (created) {
          createdPolls = created.map(poll => this.transformPollRow(poll));
        }
      }

      if (includeVoted) {
        const { data: votes, error: votesError } = await supabase
          .from('poll_votes')
          .select(`*, polls(*)`)
          .eq('user_id', userId);

        if (votesError) {
          return { data: null, error: votesError.message };
        }

        votedPolls = (votes || []).map(v => this.transformPollRow(v.poll));
      }

      return {
        data: { createdPolls, votedPolls },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get user poll history'
      };
    }
  }
  
    /**
   * Get poll statistics
   */
  static async getPollStats(): Promise<ServiceResponse<{
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    topCategories: { category: string; count: number }[];
  }>> {
    try {
      // 1) Total polls
      const { count: totalPolls, error: totalError } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true });
      if (totalError) return { data: null, error: totalError.message };

      // 2) Active polls
      const now = new Date().toISOString();
      const { count: activePolls, error: activeError } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`active_until.is.null,active_until.gt.${now}`);
      if (activeError) return { data: null, error: activeError.message };

      // 3) Total votes
      const { count: totalVotes, error: votesError } = await supabase
        .from('poll_votes')
        .select('*', { count: 'exact', head: true });
      if (votesError) return { data: null, error: votesError.message };

      // 4) Top categories (try RPC first)
      let topCategories: { category: string; count: number }[] = [];
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_category_counts');
        if (!rpcError && Array.isArray(rpcData)) {
          topCategories = (rpcData as any[])
            .map(r => ({ category: r.category, count: Number(r.count) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }
      } catch {
        // ignore RPC failure
      }

      // 5) Fallback manual count if RPC gave nothing
      if (topCategories.length === 0) {
        const { data: polls, error: pollError } = await supabase
          .from('polls')
          .select('category')
          .eq('is_active', true);
        if (pollError) return { data: null, error: pollError.message };

        const counts: Record<string, number> = {};
        (polls || []).forEach(p => {
          const cat = p.category || 'General';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        topCategories = Object.entries(counts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }

      return {
        data: {
          totalPolls: totalPolls || 0,
          activePolls: activePolls || 0,
          totalVotes: totalVotes || 0,
          topCategories
        },
        error: null
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to get poll statistics'
      };
    }
  }

  /**
   * Get distinct poll categories from polls table
   * This is a fallback method if poll_categories table doesn't exist
   */
  static async getDistinctPollCategories(): Promise<ServiceResponse<PollCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('category')
        .not('category', 'is', null);
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Extract unique categories and transform to PollCategory objects
      const categoryNames = [...new Set((data || [])
        .map(poll => poll.category)
        .filter(Boolean)
      )].sort();
      
      // Add 'General' if it's not already included
      if (!categoryNames.includes('General')) {
        categoryNames.unshift('General');
      }
      
      // Transform to PollCategory objects
      const categories: PollCategory[] = categoryNames.map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'), // Generate a simple ID
        name,
        description: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      return { data: categories, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get distinct poll categories'
      };
    }
  }

  /**
   * Search polls by title, description, or category
   * Now with pagination support
   */
  static async searchPolls(
    searchTerm: string,
    userId?: string,
    options: {
      limit?: number;
      offset?: number;
      type?: 'global' | 'country';
      country?: string;
      category?: string;
    } = {}
  ): Promise<ServiceResponse<Poll[]>> {
    try {
      const { 
        limit = 10, 
        offset = 0,
        type, 
        country, 
        category 
      } = options;
      
      // Build search query
      let query = supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      // Add filters
      if (type) {
        query = query.eq('type', type);
      }
      
      if (country) {
        query = query.eq('country', country);
      }
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data: polls, error, count } = await query;
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      // Get user votes if userId provided
      let userVotes: PollVoteRow[] = [];
      if (userId && polls && polls.length > 0) {
        const pollIds = polls.map(poll => poll.id);
        const { data: votes } = await supabase
          .from('poll_votes')
          .select('*')
          .eq('user_id', userId)
          .in('poll_id', pollIds);
        
        userVotes = votes || [];
      }
      
      // Transform polls with user vote information
      const transformedPolls = (polls || []).map(poll => {
        const userVote = userVotes.find(vote => vote.poll_id === poll.id);
        return this.transformPollRow(poll, userVote);
      });
      
      return { 
        data: transformedPolls, 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to search polls'
      };
    }
  }
}

// Export individual functions for backward compatibility and easier testing
export const {
  getAllPollCategories,
  createPollCategory,
  updatePollCategory,
  fetchPolls,
  fetchPollBySlug,
  createPoll,
  voteOnPoll,
  updatePoll,
  archivePoll,
  restorePoll,
  getPollComments,
  createPollComment,
  updatePollComment,
  deletePollComment,
  reportContent,
  getUserPollHistory,
  getPollStats,
  getDistinctPollCategories,
  searchPolls
} = PollService;