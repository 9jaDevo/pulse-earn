import React from 'react';
import { Share2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { Poll } from '../../types/api';

interface SharePollButtonProps {
  poll: Poll;
  className?: string;
  buttonStyle?: 'icon' | 'full';
}

export const SharePollButton: React.FC<SharePollButtonProps> = ({
  poll,
  className = '',
  buttonStyle = 'icon'
}) => {
  const { successToast, errorToast } = useToast();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/polls/${poll.slug}`;
    const shareTitle = poll.title || 'Check out this poll';
    const shareText = `Vote on "${shareTitle}" on PulseEarn! ${poll.description || ''}`;
    
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

  if (buttonStyle === 'icon') {
    return (
      <button
        onClick={handleShare}
        className={`bg-accent-100 text-accent-700 p-2 rounded-lg hover:bg-accent-200 transition-colors ${className}`}
        title="Share Poll"
      >
        <Share2 className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center space-x-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors ${className}`}
    >
      <Share2 className="h-4 w-4" />
      <span>Share Poll</span>
    </button>
  );
};