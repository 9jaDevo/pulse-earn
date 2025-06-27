import { useState, useEffect } from 'react';
import { PollService } from '../services/pollService';
import type { Poll, PollCreateRequest, PollVoteRequest, PollVoteResult } from '../types/api';
import { useToast } from './useToast';

/**
 * Custom hook for poll operations
 * 
 * This hook provides a convenient way to interact with poll data
 * and can be used by components that need poll functionality
 * without directly accessing the service layer.
 */
export const usePolls = (userId?: string, initialTab: 'trending' | 'recent' | 'my-polls' = 'trending') => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'my-polls'>(initialTab);
  const { errorToast } = useToast();
  const POLLS_PER_PAGE = 10;

  const fetchPolls = async (options: {
    limit?: number;
    type?: 'global' | 'country';
    country?: string;
    orderBy?: 'created_at' | 'total_votes' | 'active_until';
    order?: 'asc' | 'desc';
    includeExpired?: boolean;
    page?: number;
    append?: boolean;
    category?: string;
    searchTerm?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    const currentPage = options.page || page;
    const shouldAppend = options.append || false;
    
    try {
      let result;
      
      // Determine which API call to make based on the active tab
      if (activeTab === 'my-polls' && userId) {
        // For "My Polls" tab, fetch user's created and voted polls
        result = await PollService.getUserPollHistory(userId, {
          limit: options.limit || POLLS_PER_PAGE,
          includeCreated: true,
          includeVoted: true
        });
        
        if (result.success && result.history) {
          // Combine created and voted polls, removing duplicates
          const combinedPolls = [...result.history.createdPolls];
          
          // Add voted polls that weren't created by the user
          result.history.votedPolls.forEach(votedPoll => {
            if (!combinedPolls.some(poll => poll.id === votedPoll.id)) {
              combinedPolls.push(votedPoll);
            }
          });
          
          // Sort by most recent
          combinedPolls.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          // Update polls state
          setPolls(prevPolls => shouldAppend ? [...prevPolls, ...combinedPolls] : combinedPolls);
          setHasMore(combinedPolls.length >= (options.limit || POLLS_PER_PAGE));
        } else {
          setError(result.error || 'Failed to fetch user polls');
          errorToast(result.error || 'Failed to fetch user polls');
        }
      } else {
        // For "Trending" or "Recent" tabs
        const orderByField = activeTab === 'trending' ? 'total_votes' : 'created_at';
        
        // If we have a search term, use the search API
        if (options.searchTerm) {
          const offset = shouldAppend ? (currentPage - 1) * (options.limit || POLLS_PER_PAGE) : 0;
          
          const searchResult = await PollService.searchPolls(
            options.searchTerm,
            userId,
            {
              limit: options.limit || POLLS_PER_PAGE,
              offset: offset,
              type: options.type,
              country: options.country,
              category: options.category
            }
          );
          
          if (searchResult.error) {
            setError(searchResult.error);
            errorToast(searchResult.error);
          } else {
            // Update polls state based on append flag
            setPolls(prevPolls => shouldAppend ? [...prevPolls, ...(searchResult.data || [])] : (searchResult.data || []));
            
            // Check if there might be more results
            setHasMore((searchResult.data || []).length >= (options.limit || POLLS_PER_PAGE));
            
            if (shouldAppend) {
              setPage(currentPage);
            }
          }
        } else {
          // Regular poll fetching with filters
          const { data, error: serviceError } = await PollService.fetchPolls(userId, {
            ...options,
            orderBy: orderByField,
            order: 'desc',
            limit: options.limit || POLLS_PER_PAGE,
            offset: shouldAppend ? (currentPage - 1) * (options.limit || POLLS_PER_PAGE) : 0
          });
          
          if (serviceError) {
            setError(serviceError);
            errorToast(serviceError);
          } else {
            // Update polls state
            setPolls(prevPolls => shouldAppend ? [...prevPolls, ...(data || [])] : (data || []));
            setHasMore((data || []).length >= (options.limit || POLLS_PER_PAGE));
            
            if (shouldAppend) {
              setPage(currentPage);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      errorToast(errorMessage);
    }
    
    setLoading(false);
  };

  const loadMorePolls = async () => {
    if (loading || !hasMore) return;
    
    await fetchPolls({
      page: page + 1,
      append: true
    });
  };

  const changeTab = (newTab: 'trending' | 'recent' | 'my-polls') => {
    if (newTab === activeTab) return;
    
    setActiveTab(newTab);
    setPage(1);
    setHasMore(true);
    setPolls([]);
    
    // Fetch polls for the new tab
    fetchPolls({
      page: 1,
      append: false
    });
  };

  const fetchPollBySlug = async (slug: string): Promise<{ success: boolean; poll?: Poll; error?: string }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await PollService.fetchPollBySlug(slug, userId);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, poll: data || undefined };
    }
  };

  const createPoll = async (pollData: PollCreateRequest): Promise<{ success: boolean; poll?: Poll; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await PollService.createPoll(userId, pollData);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Add new poll to the beginning of the list
      setPolls(prev => [data!, ...prev]);
      setLoading(false);
      return { success: true, poll: data || undefined };
    }
  };

  const voteOnPoll = async (voteData: PollVoteRequest): Promise<{ success: boolean; result?: PollVoteResult; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await PollService.voteOnPoll(userId, voteData);
    
    if (serviceError) {
      setError(serviceError);
      setLoading(false);
      return { success: false, error: serviceError };
    } else {
      // Update the poll in the list with new vote data
      if (data?.poll) {
        setPolls(prev => prev.map(poll => 
          poll.id === data.poll!.id ? data.poll! : poll
        ));
      }
      setLoading(false);
      return { success: true, result: data || undefined };
    }
  };

  const getPollStats = async (): Promise<{ 
    success: boolean; 
    stats?: {
      totalPolls: number;
      activePolls: number;
      totalVotes: number;
      topCategories: { category: string; count: number }[];
    }; 
    error?: string 
  }> => {
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await PollService.getPollStats();
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, stats: data || undefined };
    }
  };

  const getUserPollHistory = async (options: {
    limit?: number;
    includeCreated?: boolean;
    includeVoted?: boolean;
  } = {}): Promise<{ 
    success: boolean; 
    history?: {
      createdPolls: Poll[];
      votedPolls: Poll[];
    }; 
    error?: string 
  }> => {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await PollService.getUserPollHistory(userId, options);
    
    setLoading(false);
    
    if (serviceError) {
      setError(serviceError);
      return { success: false, error: serviceError };
    } else {
      return { success: true, history: data || undefined };
    }
  };

  useEffect(() => {
    // Auto-fetch polls when hook is initialized or when activeTab changes
    fetchPolls({
      page: 1,
      append: false
    });
  }, [userId, activeTab]);

  return {
    polls,
    loading,
    error,
    page,
    hasMore,
    activeTab,
    fetchPolls,
    loadMorePolls,
    changeTab,
    fetchPollBySlug,
    createPoll,
    voteOnPoll,
    getPollStats,
    getUserPollHistory,
    refetch: () => fetchPolls()
  };
};