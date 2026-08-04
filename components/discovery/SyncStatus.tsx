'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { SyncLog } from '@/types/discovery';

interface Props {
  syncLog: SyncLog | null;
  isLoading?: boolean;
  onRetry?: () => void;
}

export function SyncStatus({ syncLog, isLoading, onRetry }: Props) {
  if (isLoading || !syncLog) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (syncLog.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (syncLog.status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const duration = syncLog.completed_at
    ? new Date(syncLog.completed_at).getTime() - new Date(syncLog.started_at).getTime()
    : null;

  return (
    <div className={`rounded-lg border p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
              {syncLog.status === 'in_progress' ? 'Sync in Progress' : `Sync ${syncLog.status}`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {syncLog.sync_type} sync
              {duration && ` completed in ${(duration / 1000).toFixed(1)}s`}
            </p>

            <div className="mt-3 grid grid-cols-4 gap-3">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Found</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {syncLog.urls_found}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">New</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  +{syncLog.urls_new}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Updated</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {syncLog.urls_updated}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Removed</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  -{syncLog.urls_removed}
                </p>
              </div>
            </div>

            {syncLog.error_message && (
              <div className="mt-3 rounded bg-red-100 dark:bg-red-900/20 p-2">
                <p className="text-xs text-red-700 dark:text-red-300">
                  {syncLog.error_message}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {new Date(syncLog.started_at).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {syncLog.status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Zap className="inline h-4 w-4 mr-1" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
