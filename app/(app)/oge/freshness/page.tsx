'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface FreshnessOpportunity {
  url: string;
  days_since_update: number;
  freshness_score: number;
  position: number;
  impressions: number;
  ctr_trend: number;
  potential_impression_gain: number;
  confidence: number;
  priority: string;
}

interface FreshnessStats {
  avgDaysSinceUpdate: number;
  avgFreshnessScore: number;
  veryStaleCount: number;
  staleCount: number;
  freshCount: number;
  totalContent: number;
}

export default function FreshnessEngine() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [opportunities, setOpportunities] = useState<FreshnessOpportunity[]>([]);
  const [stats, setStats] = useState<FreshnessStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/freshness/opportunities?publication_id=${publicationId}`
        );
        const data = await res.json();
        setOpportunities(data.data || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error loading freshness data:', err);
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

  const getFreshnessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Freshness Engine
        </h1>
        <p className="text-gray-600">
          Monitore e atualize conteúdo desatualizado
        </p>
      </div>

      {/* Freshness Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Score de Frescor Médio</span>
            <div className={`text-3xl font-bold ${getFreshnessColor(stats.avgFreshnessScore)}`}>
              {stats.avgFreshnessScore}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Conteúdo Muito Antigo</span>
            <div className="text-3xl font-bold text-red-600">
              {stats.veryStaleCount}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Conteúdo Antigo</span>
            <div className="text-3xl font-bold text-orange-600">
              {stats.staleCount}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Conteúdo Fresco</span>
            <div className="text-3xl font-bold text-green-600">
              {stats.freshCount}
            </div>
          </div>
        </div>
      )}

      {/* Freshness Opportunities */}
      <div className="space-y-4">
        {opportunities.map((opp, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {opp.url}
                  </h3>
                  <span className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${getPriorityColor(opp.priority)}`}>
                    {opp.priority}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Dias Sem Atualizar</span>
                    <div className="text-lg font-bold text-gray-900">
                      {opp.days_since_update}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Score de Frescor</span>
                    <div className={`text-lg font-bold ${getFreshnessColor(opp.freshness_score)}`}>
                      {opp.freshness_score.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Posição</span>
                    <div className="text-lg font-bold text-gray-900">
                      #{opp.position}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Impressões</span>
                    <div className="text-lg font-bold text-gray-900">
                      {opp.impressions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tendência CTR</span>
                    <div className={`text-lg font-bold ${opp.ctr_trend < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {opp.ctr_trend > 0 ? '+' : ''}{opp.ctr_trend.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Impact Bar */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Ganho Potencial de Impressões</span>
                    <span className="font-semibold text-green-600">
                      +{opp.potential_impression_gain.toLocaleString()} ({opp.confidence.toFixed(0)}% confiança)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (opp.potential_impression_gain / 1000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                Revisar Conteúdo
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      {opportunities.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Parabéns! Seu conteúdo está atualizado.
          </p>
        </div>
      )}
    </div>
  );
}
