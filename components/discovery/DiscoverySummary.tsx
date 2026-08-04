'use client';

import React from 'react';
import { Globe, CheckCircle, AlertCircle, Eye, Zap } from 'lucide-react';
import { DiscoverySummary as DiscoverySummaryType } from '@/types/discovery';

interface Props {
  summary: DiscoverySummaryType;
  isLoading?: boolean;
}

export function DiscoverySummary({ summary, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total URLs',
      value: summary.total_urls,
      icon: Globe,
      color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
    },
    {
      label: 'Indexed',
      value: summary.indexed_urls,
      icon: CheckCircle,
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
    },
    {
      label: 'Not Indexed',
      value: summary.not_indexed_urls,
      icon: AlertCircle,
      color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
    },
    {
      label: 'Orphaned',
      value: summary.orphaned_urls,
      icon: Eye,
      color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300',
    },
    {
      label: 'SEO Avg',
      value: `${summary.seo_average.toFixed(0)}`,
      icon: Zap,
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',
      unit: '%',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                  {stat.unit && <span className="text-sm">{stat.unit}</span>}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
