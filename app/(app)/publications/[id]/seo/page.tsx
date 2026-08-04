'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ScoreGauge } from '@/components/seo/ScoreGauge';
import { ChecklistView } from '@/components/seo/ChecklistView';
import { HistoryChart } from '@/components/seo/HistoryChart';
import { RefreshCw } from 'lucide-react';

interface SeoCheck {
  id: string;
  check_name: string;
  status: string;
  severity: string;
  message: string;
  recommendation?: string;
  details?: Record<string, any>;
}

interface SeoAudit {
  id: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  url: string;
  title?: string;
  score: number;
  grade: string;
  status: string;
  scanned_at: string;
  seo_checks?: SeoCheck[];
}

interface HistoryData {
  date: string;
  score: number;
  grade: string;
}

export default function SeoDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const publicationId = params.id as string;
  const auditId = searchParams.get('audit');

  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    async function fetchAudit() {
      if (!auditId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/audits/scan?id=${auditId}`);
        if (!res.ok) throw new Error('Failed to fetch audit');

        const data = await res.json();
        setAudit(data.audit);

        // Mock history data
        const mockHistory = [
          {
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            score: Math.max(0, data.audit.score - 15),
            grade: 'B',
          },
          {
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            score: Math.max(0, data.audit.score - 8),
            grade: 'B',
          },
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            score: Math.max(0, data.audit.score - 3),
            grade: 'A',
          },
          {
            date: new Date().toISOString(),
            score: data.audit.score,
            grade: data.audit.grade,
          },
        ];
        setHistory(mockHistory);
      } catch (error) {
        console.error('Error fetching audit:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudit();
  }, [auditId]);

  const handleRescan = async () => {
    if (!audit || scanning) return;

    setScanning(true);
    try {
      const res = await fetch('/api/audits/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publication_id: publicationId,
          url: audit.url,
          site_id: audit.site_id,
        }),
      });

      if (!res.ok) throw new Error('Failed to start scan');
      // In a real app, we'd poll for results
    } catch (error) {
      console.error('Error starting scan:', error);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando auditoria...</p>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          Nenhuma auditoria encontrada. Selecione uma URL para auditar.
        </p>
      </div>
    );
  }

  const criticalChecks =
    audit.seo_checks?.filter(c => c.severity === 'CRITICAL').length || 0;
  const highChecks =
    audit.seo_checks?.filter(c => c.severity === 'HIGH').length || 0;
  const mediumChecks =
    audit.seo_checks?.filter(c => c.severity === 'MEDIUM').length || 0;
  const lowChecks =
    audit.seo_checks?.filter(c => c.severity === 'LOW').length || 0;

  const topRecommendations = (audit.seo_checks || [])
    .filter(c => c.recommendation && c.status !== 'PASS')
    .sort((a, b) => {
      const severityOrder: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Auditoria Técnica
            </h1>
            <p className="mt-2 break-all text-gray-600 dark:text-gray-400">
              {audit.url}
            </p>
          </div>
          <button
            onClick={handleRescan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Escaneando...' : 'Reexaminar'}
          </button>
        </div>
      </div>

      {/* Score Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex justify-center">
            <ScoreGauge score={audit.score} grade={audit.grade} size="lg" />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Status da Auditoria
              </h3>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {audit.status === 'completed'
                  ? 'Completado'
                  : audit.status === 'scanning'
                  ? 'Escaneando'
                  : 'Pendente'}
              </p>
              {audit.scanned_at && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Última verificação:{' '}
                  {new Date(audit.scanned_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Resumo dos Problemas
              </h3>
              <div className="mt-2 space-y-1 text-sm">
                {criticalChecks > 0 && (
                  <p className="text-red-600 dark:text-red-400">
                    🔴 {criticalChecks} crítico{criticalChecks !== 1 ? 's' : ''}
                  </p>
                )}
                {highChecks > 0 && (
                  <p className="text-orange-600 dark:text-orange-400">
                    🟠 {highChecks} alto{highChecks !== 1 ? 's' : ''}
                  </p>
                )}
                {mediumChecks > 0 && (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    🟡 {mediumChecks} médio{mediumChecks !== 1 ? 's' : ''}
                  </p>
                )}
                {lowChecks > 0 && (
                  <p className="text-blue-600 dark:text-blue-400">
                    🔵 {lowChecks} baixo{lowChecks !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Checklist de Auditorias
        </h2>
        {audit.seo_checks && <ChecklistView checks={audit.seo_checks} />}
      </div>

      {/* Recommendations */}
      {topRecommendations.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Principais Recomendações
          </h2>
          <div className="space-y-3">
            {topRecommendations.map(check => (
              <div
                key={check.id}
                className="flex gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
              >
                <div className="flex-shrink-0 pt-1">
                  {check.severity === 'CRITICAL' && (
                    <span className="text-2xl">🔴</span>
                  )}
                  {check.severity === 'HIGH' && (
                    <span className="text-2xl">🟠</span>
                  )}
                  {check.severity === 'MEDIUM' && (
                    <span className="text-2xl">🟡</span>
                  )}
                  {check.severity === 'LOW' && (
                    <span className="text-2xl">🔵</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {check.check_name}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {check.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Histórico de Auditorias
        </h2>
        <HistoryChart data={history} />
      </div>
    </div>
  );
}
