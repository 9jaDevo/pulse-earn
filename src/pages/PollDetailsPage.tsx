import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Clock, 
  Users, 
  Globe, 
  MapPin, 
  Edit, 
  Trash2, 
  Share2, 
  Flag,
  ArrowLeft,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PollService } from '../services/pollService';
import { EditPollModal } from '../components/polls/EditPollModal';
import { DeletePollModal } from '../components/polls/DeletePollModal';
import { PollCommentSection } from '../components/polls/PollCommentSection';
import { PollAnalytics } from '../components/polls/PollAnalytics';
import { ReportContentModal } from '../components/polls/ReportContentModal';
import { supabase } from '../lib/supabase';
import { ContentAd } from '../components/ads/ContentAd';
import { SidebarAd } from '../components/ads/SidebarAd';
import { useToast } from '../hooks/useToast';
import type { Poll } from '../types/api';

export const PollDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { successToast, errorToast } = useToast();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingPoll, setVotingPoll] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Related polls state
  const [relatedPolls, setRelatedPolls] = useState<Poll[]>([]);
  const [relatedPollsLoading, setRelatedPollsLoading] = useState(false);
  
  // Check if user can edit/delete the poll
  const canManagePoll = poll && (
    profile?.role === 'admin' || 
    poll.created_by === user?.id
  );
  
  useEffect(() => {
    if (!slug) return;
    
    const fetchPollDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await PollService.fetchPollBySlug(slug, user?.id);
        
        if (fetchError || !data) {
          setError(fetchError || 'Failed to load poll details');
          return;
        }
        
        setPoll(data);
        
        // Fetch creator's name
        if (data.created_by) {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.created_by)
            .single();
          
          if (creatorProfile) {
            setCreatorName(creatorProfile.name);
          }
        }
        
        // Fetch related polls
        fetchRelatedPolls(data.category, data.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPollDetails();
  }, [slug, user?.id]);
  
  const fetchRelatedPolls = async (category: string, currentPollId: string) => {
    setRelatedPollsLoading(true);
    
    try {
      const { data, error } = await PollService.fetchPolls(user?.id, {
        limit: 3,
        category: category,
        orderBy: 'total_votes',
        order: 'desc'
      });
      
      if (error) {
        console.error('Error fetching related polls:', error);
        return;
      }
      
      // Filter out the current poll
      const filtered = (data || []).filter(p => p.id !== currentPollId);
      setRelatedPolls(filtered);
    } catch (err) {
      console.error('Exception fetching related polls:', err);
    } finally {
      setRelatedPollsLoading(false);
    }
  };
  
  const handleVote = async (optionIndex: number) => {
    if (!user || !poll) return;
    
    setVotingPoll(true);
    setSelectedOption(optionIndex);
    
    try {
      const result = await PollService.voteOnPoll(user.id, {
        poll_id: poll.id,
        vote_option: optionIndex
      });
      
      if (result.error) {
        errorToast(result.error);
        return;
      }
      
      if (result.data) {
        successToast(`Vote recorded! You earned ${result.data.pointsEarned || 50} points.`);
        
        // Update poll with new data
        if (result.data.poll) {
          setPoll(result.data.poll);
        }
      }
    } catch (err) {
      errorToast('Failed to submit your vote. Please try again.');
    } finally {
      setVotingPoll(false);
    }
  };
  
  const handlePollUpdated = (updatedPoll: Poll) => {
    setPoll(updatedPoll);
    setShowEditModal(false);
    successToast('Poll updated successfully!');
  };
  
  const handlePollDeleted = () => {
    successToast('Poll deleted successfully!');
    navigate('/polls');
  };
  
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/polls/${poll?.slug}`;
    const shareTitle = poll?.title || 'Check out this poll';
    const shareText = `Vote on "${shareTitle}" on PulseEarn! ${poll?.description || ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // User probably canceled the share
        console.log('Share canceled or failed');
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        successToast('Poll link and description copied to clipboard!');
      } catch (err) {
        errorToast('Failed to copy link. Please try again.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
          <AlertTriangle className="h-16 w-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The poll you're looking for doesn't exist or has been removed."}</p>
          <button
            onClick={() => navigate('/polls')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Polls</span>
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/polls')}
          className="mb-6 flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Polls</span>
        </button>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {/* Poll Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      poll.type === 'global' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-secondary-100 text-secondary-800'
                    }`}>
                      {poll.type === 'global' ? (
                        <Globe className="h-3 w-3 mr-1" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-1" />
                      )}
                      {poll.type === 'global' ? 'Global' : poll.country || 'Country'}
                    </span>
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-xs font-medium">
                      {poll.category}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{poll.title}</h1>
                  {poll.description && (
                    <p className="text-gray-600 mb-4">{poll.description}</p>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <button
                    onClick={handleShare}
                    className="bg-accent-100 text-accent-700 p-2 rounded-lg hover:bg-accent-200 transition-colors flex items-center"
                    title="Share Poll"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  
                  {user && poll.created_by !== user.id && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="bg-error-100 text-error-700 p-2 rounded-lg hover:bg-error-200 transition-colors flex items-center"
                      title="Report Poll"
                    >
                      <Flag className="h-5 w-5" />
                    </button>
                  )}
                  
                  {canManagePoll && (
                    <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="bg-primary-100 text-primary-700 p-2 rounded-lg hover:bg-primary-200 transition-colors flex items-center"
                      title="Edit Poll"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-error-100 text-error-700 p-2 rounded-lg hover:bg-error-200 transition-colors flex items-center"
                      title="Archive Poll"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>Created by: {creatorName || 'Anonymous'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{poll.timeLeft}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{poll.total_votes} votes</span>
                </div>
              </div>
            </div>
            
            {/* Content Ad */}
            <ContentAd layout="in-article" className="mb-6" />
            
            {/* Poll Options */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cast Your Vote</h2>
              
              <div className="space-y-4">
                {poll.options.map((option, index) => {
                  const percentage = poll.total_votes > 0 ? (option.votes / poll.total_votes) * 100 : 0;
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => {
                          if (!user) {
                            errorToast('Please sign in to vote on polls');
                            return;
                          }
                          if (!poll.hasVoted) {
                            handleVote(index);
                          }
                        }}
                        disabled={poll.hasVoted || votingPoll || !user}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          poll.hasVoted || !user
                            ? 'cursor-default'
                            : votingPoll
                            ? 'cursor-wait opacity-50'
                            : 'hover:bg-gray-50 cursor-pointer border-gray-200 hover:border-primary-300'
                        } ${
                          poll.hasVoted && poll.userVote === index
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-900 font-medium">{option.text}</span>
                          <div className="flex items-center">
                            {poll.hasVoted && poll.userVote === index && (
                              <CheckCircle className="h-5 w-5 text-primary-600 mr-2" />
                            )}
                            <span className="text-gray-600 text-sm">{option.votes} votes</span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              poll.hasVoted && poll.userVote === index
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="mt-1 text-right text-sm font-medium text-gray-700">
                          {percentage.toFixed(1)}%
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {!user && (
                <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg text-center">
                  <p className="text-primary-700 mb-2">Sign in to cast your vote and earn points!</p>
                  <button
                    onClick={() => errorToast('Please use the sign in button in the header')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Sign In to Vote
                  </button>
                </div>
              )}
              
              {user && poll.hasVoted && (
                <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                  <p className="text-success-700">You've already voted in this poll. Thanks for participating!</p>
                </div>
              )}
            </div>
            
            {/* Poll Statistics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Poll Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-primary-600 mr-2" />
                      <span className="text-gray-700 font-medium">Total Votes</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{poll.total_votes}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-secondary-600 mr-2" />
                      <span className="text-gray-700 font-medium">Leading Option</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {poll.total_votes > 0 
                        ? poll.options.reduce((prev, current) => 
                            prev.votes > current.votes ? prev : current
                          ).text.substring(0, 10) + (poll.options[0].text.length > 10 ? '...' : '')
                        : 'No votes yet'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-accent-600 mr-2" />
                      <span className="text-gray-700 font-medium">Status</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{poll.timeLeft}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Poll Analytics */}
            {canManagePoll && (
              <PollAnalytics poll={poll} />
            )}
            
            {/* Comments Section */}
            <PollCommentSection pollId={poll.id} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-80">
            <SidebarAd />
            
            {/* Related Polls */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Related Polls</h3>
              
              {relatedPollsLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Loading related polls...</p>
                </div>
              ) : relatedPolls.length === 0 ? (
                <div>
                  <p className="text-gray-500 text-sm mb-4">No related polls found in the {poll.category} category.</p>
                  <button
                    onClick={() => navigate('/polls')}
                    className="w-full mt-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                  >
                    View More Polls
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedPolls.map(relatedPoll => (
                    <div key={relatedPoll.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <Link
                        to={`/polls/${relatedPoll.slug}`}
                        className="block"
                      >
                        <h4 className="font-medium text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                          {relatedPoll.title}
                        </h4>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {relatedPoll.total_votes} votes
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {relatedPoll.timeLeft}
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => navigate(`/polls?category=${poll.category}`)}
                    className="w-full mt-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors"
                  >
                    View More in {poll.category}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Poll Modal */}
      {showEditModal && (
        <EditPollModal
          poll={poll}
          onClose={() => setShowEditModal(false)}
          onPollUpdated={handlePollUpdated}
        />
      )}
      
      {/* Delete Poll Modal */}
      {showDeleteModal && (
        <DeletePollModal
          poll={poll}
          onClose={() => setShowDeleteModal(false)}
          onPollDeleted={handlePollDeleted}
        />
      )}
      
      {/* Report Poll Modal */}
      {showReportModal && (
        <ReportContentModal
          contentType="poll"
          contentId={poll.id}
          onClose={() => setShowReportModal(false)}
          onSubmit={async (reason) => {
            if (!user) return;
            
            try {
              const { data, error } = await PollService.reportContent(user.id, {
                content_type: 'poll',
                content_id: poll.id,
                reason
              });
              
              if (error) {
                errorToast(error);
                return;
              }
              
              if (data) {
                successToast('Poll reported successfully. Our moderators will review it.');
                setShowReportModal(false);
              }
            } catch (err) {
              errorToast('Failed to report poll. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};