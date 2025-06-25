import { useState, useEffect } from 'react';

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * Custom hook for countdown timer
 * 
 * This hook calculates the time remaining until a target date/time
 * and updates every second. Useful for daily reset timers, event countdowns, etc.
 */
export const useCountdown = (targetDate: Date): CountdownTime => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const totalSeconds = Math.floor(difference / 1000);

        setTimeLeft({
          hours,
          minutes,
          seconds,
          totalSeconds
        });
      } else {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0
        });
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

/**
 * Get the next midnight UTC date
 */
export const getNextMidnightUTC = (): Date => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0); // Set to next midnight UTC
  return nextMidnight;
};