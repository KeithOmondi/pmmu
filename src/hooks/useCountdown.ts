import { useEffect, useState } from "react";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

const calculateCountdown = (targetDate?: string): CountdownResult | null => {
  if (!targetDate) return null;

  const target = new Date(targetDate).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
};

const useCountdown = (targetDate?: string) => {
  const [time, setTime] = useState<CountdownResult | null>(() =>
    calculateCountdown(targetDate)
  );

  useEffect(() => {
    if (!targetDate) return;

    setTime(calculateCountdown(targetDate));

    const interval = setInterval(() => {
      setTime(calculateCountdown(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return time;
};

export default useCountdown;
