import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Zap, Star, Trophy } from 'lucide-react';
import type { DailyRewardStatus, SpinResult } from '../../types/api';

interface SpinWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DailyRewardStatus | null;
  performSpin: () => Promise<{ success: boolean; result?: SpinResult; error?: string }>;
  spinResult: SpinResult | null;
  setSpinResult: (result: SpinResult | null) => void;
  spinLoading: boolean;
  setSpinLoading: (loading: boolean) => void;
}

interface WheelSegment {
  label: string;
  points: number;
  color: string;
  textColor: string;
  type: 'points' | 'try_again';
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '250', points: 250, color: '#FFD700', textColor: '#000', type: 'points' },
  { label: 'Try Again', points: 0, color: '#FF1493', textColor: '#FFF', type: 'try_again' },
  { label: '100', points: 100, color: '#FFFF00', textColor: '#000', type: 'points' },
  { label: 'Try Again', points: 0, color: '#F5F5DC', textColor: '#000', type: 'try_again' },
  { label: '50', points: 50, color: '#8B4513', textColor: '#FFF', type: 'points' },
  { label: 'Try Again', points: 0, color: '#4169E1', textColor: '#FFF', type: 'try_again' },
  { label: '25', points: 25, color: '#0000FF', textColor: '#FFF', type: 'points' },
  { label: 'Try Again', points: 0, color: '#32CD32', textColor: '#000', type: 'try_again' },
  { label: '10', points: 10, color: '#FFA500', textColor: '#000', type: 'points' },
  { label: 'Try Again', points: 0, color: '#800080', textColor: '#FFF', type: 'try_again' }
];

export const SpinWinModal: React.FC<SpinWinModalProps> = ({
  isOpen,
  onClose,
  status,
  performSpin,
  spinResult,
  setSpinResult,
  spinLoading,
  setSpinLoading
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSpin = async () => {
    if (!status?.canSpin || isSpinning) return;

    setIsSpinning(true);
    setSpinLoading(true);
    setSpinResult(null);
    setShowConfetti(false);

    // Calculate random rotation (multiple full rotations + final position)
    const baseRotations = 8; // More rotations for better effect
    const randomRotations = Math.random() * 4; // Add 0-4 more rotations
    const totalRotations = baseRotations + randomRotations;
    
    // Start spinning animation
    const spinDegrees = totalRotations * 360;
    setWheelRotation(prev => prev + spinDegrees);

    // Wait for spin animation to complete
    setTimeout(async () => {
      const result = await performSpin();
      
      if (result.success && result.result) {
        setSpinResult(result.result);
        
        // Show confetti for wins
        if (result.result.success) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
      
      setIsSpinning(false);
      setSpinLoading(false);
    }, 4000); // 4 second spin duration
  };

  const handleClose = () => {
    if (!isSpinning) {
      setSpinResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-60">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {Math.random() > 0.5 ? '🎉' : '✨'}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative animate-slide-up">
        <button
          onClick={handleClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Spin & <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Win!</span>
          </h2>
          <p className="text-gray-600">
            Spin the wheel for a chance to win amazing prizes!
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative flex justify-center mb-8">
          <div className="relative">
            {/* Outer Ring with LED Lights */}
            <div className="absolute inset-0 w-96 h-96 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 p-4 shadow-2xl">
              {/* LED Lights */}
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-white rounded-full shadow-lg animate-pulse"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 15}deg) translateY(-176px)`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>

            {/* Main Wheel */}
            <div className="relative w-80 h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white ml-8 mt-8">
              <svg 
                className={`w-full h-full ${isSpinning ? 'transition-transform duration-[4000ms] ease-out' : ''}`}
                style={{ transform: `rotate(${wheelRotation}deg)` }}
                viewBox="0 0 200 200"
              >
                {WHEEL_SEGMENTS.map((segment, index) => {
                  const startAngle = (index * segmentAngle) * (Math.PI / 180);
                  const endAngle = ((index + 1) * segmentAngle) * (Math.PI / 180);
                  const midAngle = (startAngle + endAngle) / 2;
                  
                  // Calculate path for segment
                  const x1 = 100 + 95 * Math.cos(startAngle);
                  const y1 = 100 + 95 * Math.sin(startAngle);
                  const x2 = 100 + 95 * Math.cos(endAngle);
                  const y2 = 100 + 95 * Math.sin(endAngle);
                  
                  const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M 100 100`,
                    `L ${x1} ${y1}`,
                    `A 95 95 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  // Calculate text position
                  const textRadius = 65;
                  const textX = 100 + textRadius * Math.cos(midAngle);
                  const textY = 100 + textRadius * Math.sin(midAngle);
                  
                  return (
                    <g key={index}>
                      {/* Segment */}
                      <path
                        d={pathData}
                        fill={segment.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                      
                      {/* Text */}
                      <text
                        x={textX}
                        y={textY}
                        fill={segment.textColor}
                        fontSize={segment.label.length > 3 ? "8" : "12"}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${(midAngle * 180 / Math.PI) + (segment.label.length > 3 ? 90 : 90)}, ${textX}, ${textY})`}
                      >
                        {segment.label === 'Try Again' ? (
                          <tspan>
                            <tspan x={textX} dy="-2">Try</tspan>
                            <tspan x={textX} dy="10">Again</tspan>
                          </tspan>
                        ) : (
                          segment.label
                        )}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Pointer Arrow */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
              <div 
                className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-red-600"
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
                }}
              ></div>
            </div>

            {/* Center Hub */}
            <div className="absolute w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg z-10 border-4 border-white" style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-25%, -30%)' 
            }}>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {spinResult && (
          <div className={`p-6 rounded-xl mb-6 text-center ${
            spinResult.success 
              ? 'bg-gradient-to-r from-success-50 to-success-100 border border-success-200' 
              : 'bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200'
          }`}>
            <div className="flex items-center justify-center mb-3">
              {spinResult.success ? (
                <Trophy className="h-8 w-8 text-success-600 mr-2" />
              ) : (
                <RotateCcw className="h-8 w-8 text-warning-600 mr-2" />
              )}
              <h3 className={`text-xl font-bold ${
                spinResult.success ? 'text-success-700' : 'text-warning-700'
              }`}>
                {spinResult.success ? 'Congratulations!' : 'Better Luck Tomorrow!'}
              </h3>
            </div>
            <p className={`text-lg font-medium ${
              spinResult.success ? 'text-success-600' : 'text-warning-600'
            }`}>
              {spinResult.message}
            </p>
            {spinResult.success && spinResult.points > 0 && (
              <div className="flex items-center justify-center mt-3">
                <Zap className="h-5 w-5 text-accent-600 mr-1" />
                <span className="text-accent-600 font-bold">+{spinResult.points} points added!</span>
              </div>
            )}
          </div>
        )}

        {/* Spin Button */}
        <div className="text-center">
          <button
            onClick={handleSpin}
            disabled={!status?.canSpin || isSpinning}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
              status?.canSpin && !isSpinning
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSpinning ? (
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-5 w-5 animate-spin" />
                <span>Spinning...</span>
              </div>
            ) : status?.canSpin ? (
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>SPIN NOW!</span>
              </div>
            ) : (
              'Already Spun Today'
            )}
          </button>
          
          {status?.canSpin && !isSpinning && (
            <p className="text-gray-500 text-sm mt-3">
              Free spin available! Come back tomorrow for another chance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};