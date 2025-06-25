/**
 * Social Share Images Utility
 * 
 * This utility provides functions to select appropriate social share images
 * for different platforms, with fallbacks to general images.
 */

// Base URL where social share banner images are hosted
// IMPORTANT: Replace this with your actual hosting URL in production
const BASE_IMAGE_URL = 'https://images.pexels.com/photos/';

// Sample image IDs from Pexels (free stock photos)
// In a real implementation, you would have your own branded images
const SOCIAL_SHARE_IMAGES = {
  facebook: [
    '3943882/pexels-photo-3943882.jpeg', // Knowledge concept
    '3184639/pexels-photo-3184639.jpeg', // People discussing
    '3184418/pexels-photo-3184418.jpeg'  // Team collaboration
  ],
  twitter: [
    '3184292/pexels-photo-3184292.jpeg', // Person with lightbulb
    '3184317/pexels-photo-3184317.jpeg', // Creative thinking
    '3184339/pexels-photo-3184339.jpeg'  // Brainstorming
  ],
  linkedin: [
    '3184325/pexels-photo-3184325.jpeg', // Professional setting
    '3184603/pexels-photo-3184603.jpeg', // Business discussion
    '3184338/pexels-photo-3184338.jpeg'  // Professional growth
  ],
  general: [
    '3184291/pexels-photo-3184291.jpeg', // General knowledge
    '3184296/pexels-photo-3184296.jpeg', // Learning concept
    '3184311/pexels-photo-3184311.jpeg', // Education theme
    '3184317/pexels-photo-3184317.jpeg'  // Thinking and learning
  ]
};

/**
 * Get a social share image URL based on platform
 * 
 * @param platformHint Optional platform name to get specific image (facebook, twitter, linkedin)
 * @returns Full URL to a social share image
 */
export const getSocialShareImage = (platformHint?: string): string => {
  let imagePool: string[] = [];
  
  // If platform hint is provided and valid, try to get platform-specific images
  if (platformHint && platformHint.toLowerCase() in SOCIAL_SHARE_IMAGES) {
    const platform = platformHint.toLowerCase() as keyof typeof SOCIAL_SHARE_IMAGES;
    imagePool = SOCIAL_SHARE_IMAGES[platform];
  }
  
  // If no platform-specific images found or no hint provided, use general images
  if (imagePool.length === 0) {
    imagePool = SOCIAL_SHARE_IMAGES.general;
  }
  
  // Randomly select an image from the pool
  const randomIndex = Math.floor(Math.random() * imagePool.length);
  const selectedImage = imagePool[randomIndex];
  
  // Return the full URL
  return `${BASE_IMAGE_URL}${selectedImage}`;
};

/**
 * Get a social share image URL specifically for trivia achievements
 * 
 * @param score The user's score percentage
 * @returns Full URL to an appropriate achievement image
 */
export const getTriviaAchievementImage = (score: number): string => {
  // Select image based on score range
  if (score >= 90) {
    // Excellent performance
    return `${BASE_IMAGE_URL}3184291/pexels-photo-3184291.jpeg`;
  } else if (score >= 70) {
    // Good performance
    return `${BASE_IMAGE_URL}3184296/pexels-photo-3184296.jpeg`;
  } else if (score >= 50) {
    // Average performance
    return `${BASE_IMAGE_URL}3184311/pexels-photo-3184311.jpeg`;
  } else {
    // Needs improvement
    return `${BASE_IMAGE_URL}3184317/pexels-photo-3184317.jpeg`;
  }
};