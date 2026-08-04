'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ClusterGap {
  pillar_topic: string;
  completeness_score: number;
  missing_keywords: string[];
  target_count: number;
  current_count: number;
  priority: string;
  estimated_traffic_potential: number;
}

interface ClusterStats {
  totalClusters: number;
  completeCluster: number;
  incompleteCluster: number;
  avgCompletenessScore: number;
  totalArticles: number;
  totalImpressions: number;
}

export default function TopicClusters() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [gaps, setGaps] = useState<ClusterGap[]>([]);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/clusters/gaps?publication_id=${publicationId}`
        );
        const data = await res.json();
        setGaps(data.data || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error loading cluster gaps:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Topic Clusters
        </h1>
        <p className="text-gray-600">
          Gerenciar clusters de tópicos e lacunas de conteúdo
        </p>
      </div>

      {/* Cluster Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Total de Clusters</span>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalClusters}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Completos</span>
            <div className="text-3xl font-bold text-green-600">
              {stats.completeCluster}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Incompletos</span>
            <div className="text-3xl font-bold text-red-600">
              {stats.incompleteCluster}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Completude Média</span>
            <div className="text-3xl font-bold text-blue-600">
              {stats.avgCompletenessScore}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Total de Artigos</span>
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalArticles}
            </div>
          </div>
        </div>
      )}

      {/* Cluster Gaps */}
      <div className="space-y-4">
        {gaps.map((gap, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {gap.pillar_topic}
                  </h3>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(gap.priority)}`}>
                    {gap.priority}
                  </span>
                </div>

                {/* Completeness Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Completude</span>
                    <span className="font-semibold text-gray-900">
                      {gap.current_count}/{gap.target_count} artigos ({gap.completeness_score.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${gap.completeness_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Potencial de Tráfego</span>
                    <div className="text-lg font-bold text-green-600">
                      +{gap.estimated_traffic_potential.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Keywords Faltando</span>
                    <div className="text-lg font-bold text-orange-600">
                      {gap.missing_keywords.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                Keywords Sugeridos
              </h4>
              <div className="flex flex-wrap gap-2">
                {gap.missing_keywords.slice(0, 5).map((keyword, i) => (
                  <div
                    key={i}
                    className="bg-white px-3 py-1 rounded border border-gray-300 text-sm text-gray-700"
                  >
                    {keyword}
                  </div>
                ))}
                {gap.missing_keywords.length > 5 && (
                  <div className="text-xs text-gray-500 py-1">
                    +{gap.missing_keywords.length - 5} mais
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {gaps.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Parabéns! Todos os seus clusters estão bem completos.
          </p>
        </div>
      )}
    </div>
  );
}
