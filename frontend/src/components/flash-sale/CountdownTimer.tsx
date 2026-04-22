"use client";

import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string; // ISO string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="animate-pulse bg-gray-200 h-8 w-32 rounded-md"></div>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="flex space-x-2 text-white font-bold font-mono text-lg">
      <div className="bg-red-600 px-2 py-1 rounded shadow-inner">
        {formatNumber(timeLeft.hours)}
      </div>
      <span className="text-red-600 self-center">:</span>
      <div className="bg-red-600 px-2 py-1 rounded shadow-inner">
        {formatNumber(timeLeft.minutes)}
      </div>
      <span className="text-red-600 self-center">:</span>
      <div className="bg-red-600 px-2 py-1 rounded shadow-inner">
        {formatNumber(timeLeft.seconds)}
      </div>
    </div>
  );
}
