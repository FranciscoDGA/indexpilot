'use client';

import React from 'react';
import { ScoreGauge } from './ScoreGauge';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface AuditCardProps {
  title: string;
  score: number;
  grade: string;
  status: string;
  problemsCount: number;
  lastScannedAt?: string;
  onClick?: () => void;
}

export function AuditCard({
  title,
  score,
  grade,
  status,
  problemsCount,
  lastScannedAt,
  onClick,
}: AuditCardProps) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scanning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'completed':
        return 'Completado';
      case 'scanning':
        return 'Escaneando...';
      case 'error':
        return 'Erro';
      default:
        return 'Pendente';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
            {title}
          </h3>
          <span className={`mt-2 inline-block rounded px-2 py-1 text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>
        <div className="ml-2 flex-shrink-0">
          <ScoreGauge score={score} grade={grade} size="sm" showLabel={false} />
        </div>
      </div>

      <div className="mb-3 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
        {problemsCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            <span>{problemsCount} problema{problemsCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        {lastScannedAt && (
          <div className="flex items-center gap-1">
            <span>Última: {formatDate(lastScannedAt)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{score} / 100</div>
        <div className={`text-sm font-bold ${
          grade === 'A+' || grade === 'A'
            ? 'text-green-600 dark:text-green-400'
            : grade === 'B'
            ? 'text-blue-600 dark:text-blue-400'
            : grade === 'C'
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {grade}
        </div>
      </div>
    </div>
  );
}
