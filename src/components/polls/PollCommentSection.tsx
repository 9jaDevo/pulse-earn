import React, { useState, useEffect } from 'react';
import { Send, Reply, Edit, Trash2, Flag, User, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PollService } from '../../services/pollService';
import { useToast } from '../../hooks/useToast';
import type { PollComment } from '../../types/api';
import { ReportContentModal } from './ReportContentModal';

interface PollCommentSectionProps {
  pollId: string;
}

export const PollCommentSection: React.FC<PollCommentSectionProps> = ({ pollId }) => {
  const { user, profile } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [comments, setComments] = useState<PollComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<PollComment | null>(null);
  const [editingComment, setEditingComment] = useState<PollComment | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingContent, setReportingContent] = useState<{
    id: string;
    type: 'poll' | 'comment';
  } | null>(null);
  
  useEffect(() => {
    fetchComments();
  }, [pollId]);
  
  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await PollService.getPollComments(pollId);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitComment = async () => {
    if (!user) {
      errorToast('Please sign in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      errorToast('Comment cannot be empty');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data, error } = await PollService.createPollComment(user.id, {
        poll_id: pollId,
        comment_text: commentText.trim(),
        parent_comment_id: replyingTo?.id
      });
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        successToast('Comment posted successfully!');
        setCommentText('');
        setReplyingTo(null);
        
        // Refresh comments
        fetchComments();
      }
    } catch (err) {
      errorToast('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditComment = async () => {
    if (!user || !editingComment) {
      return;
    }
    
    if (!editText.trim()) {
      errorToast('Comment cannot be empty');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data, error } = await PollService.updatePollComment(
        user.id,
        editingComment.id,
        editText.trim()
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        successToast('Comment updated successfully!');
        setEditingComment(null);
        setEditText('');
        
        // Refresh comments
        fetchComments();
      }
    } catch (err) {
      errorToast('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      return;
    }
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { data, error } = await PollService.deletePollComment(user.id, commentId);
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        successToast('Comment deleted successfully!');
        
        // Refresh comments
        fetchComments();
      }
    } catch (err) {
      errorToast('Failed to delete comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReportContent = async (reason: string) => {
    if (!user || !reportingContent) {
      return;
    }
    
    try {
      const { data, error } = await PollService.reportContent(user.id, {
        content_type: reportingContent.type,
        content_id: reportingContent.id,
        reason
      });
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        successToast('Content reported successfully. Our moderators will review it.');
        setShowReportModal(false);
        setReportingContent(null);
      }
    } catch (err) {
      errorToast('Failed to report content. Please try again.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const canModerate = profile?.role === 'admin' || profile?.role === 'moderator';
  
  const renderComment = (comment: PollComment, isReply = false) => {
    const isEditing = editingComment?.id === comment.id;
    const isAuthor = user?.id === comment.user_id;
    
    return (
      <div 
        key={comment.id} 
        className={`${isReply ? 'ml-12 mt-3' : 'border-b border-gray-100 py-4'}`}
      >
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
            {comment.user?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</p>
                <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
              </div>
              
              {(isAuthor || canModerate) && !isEditing && (
                <div className="relative group">
                  <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment);
                            setEditText(comment.comment_text);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-gray-100 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                    
                    {canModerate && !isAuthor && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-gray-100 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Moderate
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {!isAuthor && !isEditing && (
                <button
                  onClick={() => {
                    setReportingContent({
                      id: comment.id,
                      type: 'comment'
                    });
                    setShowReportModal(true);
                  }}
                  className="text-gray-400 hover:text-error-600 p-1 rounded-full hover:bg-gray-100"
                  title="Report Comment"
                >
                  <Flag className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Edit your comment..."
                  rows={3}
                />
                
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditText('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditComment}
                    disabled={submitting || !editText.trim()}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-800 mt-1">{comment.comment_text}</p>
                
                {!isReply && user && (
                  <button
                    onClick={() => {
                      setReplyingTo(comment);
                      setCommentText('');
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 flex items-center"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Discussion</h2>
      
      {/* Comment Form */}
      {user ? (
        <div className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
              {profile?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
            </div>
            
            <div className="flex-1">
              {replyingTo && (
                <div className="bg-gray-50 p-2 rounded-lg mb-2 text-sm flex justify-between items-center">
                  <span>
                    Replying to <span className="font-medium">{replyingTo.user?.name || 'Anonymous'}</span>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={replyingTo ? "Write a reply..." : "Join the discussion..."}
                rows={3}
              />
              
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Be respectful and constructive in your comments.
                </p>
                
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentText.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Posting...' : replyingTo ? 'Reply' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
          <p className="text-gray-700 mb-2">Sign in to join the discussion</p>
          <button
            onClick={() => errorToast('Please use the sign in button in the header')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In to Comment
          </button>
        </div>
      )}
      
      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comments...</p>
        </div>
      ) : error ? (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No comments yet</p>
          <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
      
      {/* Report Modal */}
      {showReportModal && reportingContent && (
        <ReportContentModal
          contentType={reportingContent.type}
          contentId={reportingContent.id}
          onClose={() => {
            setShowReportModal(false);
            setReportingContent(null);
          }}
          onSubmit={handleReportContent}
        />
      )}
    </div>
  );
};