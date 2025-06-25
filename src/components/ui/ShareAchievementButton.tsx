import React, { useState } from 'react';
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from 'lucide-react';
import { getSocialShareImage, getTriviaAchievementImage } from '../../utils/socialShareImages';
import { useToast } from '../../hooks/useToast';

interface ShareAchievementButtonProps {
  title: string;
  score: number;
  pointsEarned: number;
  gameLink: string;
  className?: string;
  buttonStyle?: 'icon' | 'full';
}

export const ShareAchievementButton: React.FC<ShareAchievementButtonProps> = ({
  title,
  score,
  pointsEarned,
  gameLink,
  className = '',
  buttonStyle = 'full'
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const { successToast, errorToast } = useToast();

  const generateShareText = (): string => {
    return `I just scored ${score}% on "${title}" and earned ${pointsEarned} points on PulseEarn! Come earn with me! 🎮 #PulseEarn #Trivia`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    const shareUrl = gameLink;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My PulseEarn Achievement: ${score}% on ${title}`,
          text: shareText,
          url: shareUrl
        });
        successToast('Shared successfully!');
      } catch (err) {
        // User probably canceled the share
        console.log('Share canceled or failed');
      }
    } else {
      // Show share options dropdown if native sharing is not available
      setShowShareOptions(true);
    }
  };

  const handleCopyLink = async () => {
    const shareText = generateShareText();
    const textToCopy = `${shareText} ${gameLink}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      successToast('Copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      errorToast('Failed to copy link. Please try again.');
    }
    
    setShowShareOptions(false);
  };

  const handlePlatformShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const shareText = encodeURIComponent(generateShareText());
    const shareUrl = encodeURIComponent(gameLink);
    const shareImage = encodeURIComponent(getSocialShareImage(platform));
    
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
    }
    
    // Open in new window
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

  if (buttonStyle === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={handleShare}
          className={`bg-accent-100 text-accent-700 p-2 rounded-lg hover:bg-accent-200 transition-colors ${className}`}
          title="Share Achievement"
        >
          <Share2 className="h-5 w-5" />
        </button>
        
        {showShareOptions && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-slide-up">
            <div className="p-2">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => handlePlatformShare('twitter')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => handlePlatformShare('facebook')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handlePlatformShare('linkedin')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={`flex items-center space-x-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors ${className}`}
      >
        <Share2 className="h-4 w-4" />
        <span>Share Achievement</span>
      </button>
      
      {showShareOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-slide-up">
          <div className="p-2">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={() => handlePlatformShare('twitter')}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              <span>Twitter</span>
            </button>
            <button
              onClick={() => handlePlatformShare('facebook')}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => handlePlatformShare('linkedin')}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};