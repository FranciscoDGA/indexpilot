'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuditCard } from '@/components/seo/AuditCard';
import { AlertCircle, TrendingUp, AlertTriangle, Star } from 'lucide-react';

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
  seo_checks?: any[];
}

interface AuditStats {
  totalAudits: number;
  averageScore: number;
  criticalCount: number;
  bestScore: number;
  bestUrl: string;
}

export default function SeoPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<SeoAudit[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudits() {
      try {
        const res = await fetch('/api/audits/scan?id=all', {
          method: 'GET',
        });

        if (!res.ok) {
          console.error('Failed to fetch audits');
          setLoading(false);
          return;
        }

        const data = await res.json();
        const auditList = data.audit ? [data.audit] : data.audits || [];

        setAudits(auditList);

        if (auditList.length > 0) {
          const avgScore =
            auditList.reduce((sum: number, a: SeoAudit) => sum + a.score, 0) /
            auditList.length;
          const criticalChecks = auditList.reduce(
            (sum: number, a: SeoAudit) => sum + (a.seo_checks?.filter((c: any) => c.severity === 'CRITICAL').length || 0),
            0
          );
          const best = auditList.reduce((max: SeoAudit, a: SeoAudit) =>
            a.score > max.score ? a : max
          );

          setStats({
            totalAudits: auditList.length,
            averageScore: Math.round(avgScore),
            criticalCount: criticalChecks,
            bestScore: best.score,
            bestUrl: best.url,
          });
        }
      } catch (error) {
        console.error('Error fetching audits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudits();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando auditorias SEO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Inspector</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Monitore e melhore a saúde técnica de suas URLs
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Score Médio
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.averageScore}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  URLs Críticas
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                  {audits.filter(a => a.score < 60).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Erros Graves
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.criticalCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Melhor Score
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.bestScore}
                </p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Audits */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Auditorias Recentes
        </h2>
        {audits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-900">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma auditoria realizada ainda. Comece auditando uma URL.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {audits.map(audit => (
              <AuditCard
                key={audit.id}
                title={audit.url}
                score={audit.score}
                grade={audit.grade}
                status={audit.status}
                problemsCount={
                  audit.seo_checks?.filter(c => c.status !== 'PASS').length || 0
                }
                lastScannedAt={audit.scanned_at}
                onClick={() =>
                  router.push(`/publications/${audit.publication_id}/seo?audit=${audit.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
