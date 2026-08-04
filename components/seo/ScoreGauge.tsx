'use client';

import React from 'react';

interface ScoreGaugeProps {
  score: number;
  grade: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreGauge({
  score,
  grade,
  size = 'md',
  showLabel = true,
}: ScoreGaugeProps) {
  const percentage = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return 'from-green-500 to-green-600';
    if (s >= 80) return 'from-blue-500 to-blue-600';
    if (s >= 70) return 'from-yellow-500 to-yellow-600';
    if (s >= 60) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A+':
      case 'A':
        return 'text-green-600 dark:text-green-400';
      case 'B':
        return 'text-blue-600 dark:text-blue-400';
      case 'C':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'D':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const fontSizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} relative`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45"
            className="fill-none stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="3"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45"
            className={`fill-none stroke-2 transition-all duration-500 ${
              score >= 90
                ? 'stroke-green-500'
                : score >= 80
                ? 'stroke-blue-500'
                : score >= 70
                ? 'stroke-yellow-500'
                : score >= 60
                ? 'stroke-orange-500'
                : 'stroke-red-500'
            }`}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${fontSizeClasses[size]} font-bold text-gray-900 dark:text-white`}>
            {Math.round(percentage)}
          </div>
          {showLabel && <div className="text-xs text-gray-600 dark:text-gray-400">/ 100</div>}
        </div>
      </div>
      {showLabel && (
        <div className={`text-lg font-bold ${getGradeColor(grade)}`}>{grade}</div>
      )}
    </div>
  );
}
