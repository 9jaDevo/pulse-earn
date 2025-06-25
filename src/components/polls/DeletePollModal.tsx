import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PollService } from '../../services/pollService';
import { useToast } from '../../hooks/useToast';
import type { Poll } from '../../types/api';

interface DeletePollModalProps {
  poll: Poll;
  onClose: () => void;
  onPollDeleted: () => void;
}

export const DeletePollModal: React.FC<DeletePollModalProps> = ({
  poll,
  onClose,
  onPollDeleted
}) => {
  const { user } = useAuth();
  const { errorToast, successToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const handleArchive = async () => {
    if (!user) {
      errorToast('You must be logged in to archive a poll');
      return;
    }
    
    if (confirmText !== poll.title) {
      errorToast('Please type the poll title to confirm archiving');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log(`Attempting to archive poll: ${poll.id}`);
      const { data, error } = await PollService.archivePoll(user.id, poll.id);
      
      if (error) {
        console.error(`Error archiving poll: ${error}`);
        errorToast(error);
        setLoading(false);
        return;
      }
      
      // Check if the archiving was successful
      if (data) {
        console.log('Poll archived successfully');
        successToast('Poll archived successfully');
        onPollDeleted();
      } else {
        console.error('Poll archiving returned no data');
        errorToast('Failed to archive poll. It may have already been archived.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Exception during poll archiving:', err);
      errorToast('Failed to archive poll. Please try again.');
      setLoading(false);
    } finally {
      // Loading state is cleared in success case by onPollDeleted callback
      // and in error cases directly in those blocks
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-error-100 p-3 rounded-full inline-flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-error-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Archive Poll</h2>
          <p className="text-gray-600">
            Are you sure you want to archive this poll? It will be hidden from users but can be restored later.
          </p>
        </div>

        <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
          <p className="text-error-800 font-medium mb-2">You are about to archive:</p>
          <p className="text-error-700">{poll.title}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type the poll title to confirm archiving
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-error-500 focus:border-transparent"
            placeholder="Enter poll title"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={loading || confirmText !== poll.title}
            className="bg-error-600 text-white px-6 py-3 rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Archiving...' : 'Archive Poll'}
          </button>
        </div>
      </div>
    </div>
  );
};