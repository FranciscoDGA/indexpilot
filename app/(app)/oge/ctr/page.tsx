'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CTRGap {
  keyword: string;
  position: number;
  current_ctr: number;
  expected_ctr: number;
  gap_percentage: number;
  impressions: number;
  potential_clicks: number;
  suggested_titles: string[];
  suggested_descriptions: string[];
  priority: string;
}

export default function CTROptimization() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [gaps, setGaps] = useState<CTRGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGaps = async () => {
      try {
        const res = await fetch(
          `/api/oge/ctr/analyze?publication_id=${publicationId}`
        );
        const data = await res.json();
        setGaps(data.data || []);
      } catch (err) {
        console.error('Error loading CTR gaps:', err);
        setError('Failed to load CTR gaps');
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadGaps();
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
          CTR Optimization
        </h1>
        <p className="text-gray-600">
          {gaps.length} keywords com oportunidades de otimização
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {gaps.map((gap, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {gap.keyword}
                  </h3>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(gap.priority)}`}>
                    {gap.priority}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Posição</span>
                    <div className="text-2xl font-bold text-gray-900">
                      #{gap.position}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">CTR Atual</span>
                    <div className="text-2xl font-bold text-gray-900">
                      {gap.current_ctr.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">CTR Esperado</span>
                    <div className="text-2xl font-bold text-blue-600">
                      {gap.expected_ctr.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Lacuna</span>
                    <div className="text-2xl font-bold text-red-600">
                      {gap.gap_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <span className="text-gray-500 text-sm">Impressões</span>
                <div className="text-xl font-semibold text-gray-900">
                  {gap.impressions.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Cliques Potenciais</span>
                <div className="text-xl font-semibold text-green-600">
                  +{gap.potential_clicks.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Sugestões de Títulos
                </h4>
                <div className="space-y-2">
                  {gap.suggested_titles.slice(0, 3).map((title, i) => (
                    <div
                      key={i}
                      className="bg-blue-50 p-3 rounded text-sm text-gray-700 border border-blue-200"
                    >
                      {title}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Sugestões de Meta Descriptions
                </h4>
                <div className="space-y-2">
                  {gap.suggested_descriptions.slice(0, 3).map((desc, i) => (
                    <div
                      key={i}
                      className="bg-green-50 p-3 rounded text-sm text-gray-700 border border-green-200"
                    >
                      {desc}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gaps.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Nenhuma oportunidade de CTR encontrada. Seu site está otimizado!
          </p>
        </div>
      )}
    </div>
  );
}
