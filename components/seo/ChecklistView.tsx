'use client';

import React, { useState } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
interface ChecklistViewProps {
  checks: Array<{
    id: string;
    check_name: string;
    status: string;
    severity: string;
    message: string;
    recommendation?: string;
    details?: Record<string, any>;
  }>;
  expandedByDefault?: boolean;
}

export function ChecklistView({ checks, expandedByDefault = false }: ChecklistViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(expandedByDefault ? checks[0]?.id : null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'Aprovado';
      case 'WARNING':
        return 'Aviso';
      case 'ERROR':
        return 'Erro';
      case 'INFO':
        return 'Informação';
      default:
        return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      CRITICAL: 'Crítica',
      HIGH: 'Alta',
      MEDIUM: 'Média',
      LOW: 'Baixa',
    };
    return labels[severity] || severity;
  };

  const groupedChecks = checks.reduce(
    (acc, check) => {
      const status = check.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(check);
      return acc;
    },
    {} as Record<string, typeof checks>
  );

  const statusOrder = ['PASS', 'INFO', 'WARNING', 'ERROR'];

  return (
    <div className="space-y-4">
      {statusOrder.map(status => {
        const checksInStatus = groupedChecks[status];
        if (!checksInStatus || checksInStatus.length === 0) return null;

        return (
          <div key={status} className="rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                {status === 'PASS' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {status === 'WARNING' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {status === 'ERROR' && <AlertCircle className="h-5 w-5 text-red-500" />}
                {status === 'INFO' && <Info className="h-5 w-5 text-blue-500" />}
                {getStatusLabel(status)} ({checksInStatus.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {checksInStatus.map(check => (
                <div key={check.id} className="bg-white dark:bg-gray-900">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === check.id ? null : check.id)
                    }
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {check.check_name}
                          </span>
                          {check.severity && (
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${getSeverityColor(check.severity)}`}>
                              {getSeverityLabel(check.severity)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {check.message}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${
                          expandedId === check.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expandedId === check.id && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                      {check.recommendation && (
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                            Recomendação
                          </h4>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {check.recommendation}
                          </p>
                        </div>
                      )}

                      {check.details && Object.keys(check.details).length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                            Detalhes Técnicos
                          </h4>
                          <div className="mt-1 bg-gray-900 rounded px-2 py-1 text-xs text-gray-100 font-mono overflow-x-auto dark:bg-gray-950">
                            <pre>{JSON.stringify(check.details, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
