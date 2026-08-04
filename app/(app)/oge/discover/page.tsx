'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DiscoverCheck {
  url: string;
  overall_score: number;
  image_quality: number;
  og_tags_complete: boolean;
  content_freshness_score: number;
  core_web_vitals_score: number;
  readiness_status: 'ready' | 'partial' | 'not_ready';
  estimated_discover_traffic: number;
  recommendations: string[];
}

interface DiscoverPotential {
  current_discover_traffic: number;
  potential_discover_traffic: number;
  eligible_articles: number;
  total_articles: number;
  recommendation: string;
}

export default function DiscoverReadiness() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [checks, setChecks] = useState<DiscoverCheck[]>([]);
  const [potential, setPotential] = useState<DiscoverPotential | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/discover/readiness?publication_id=${publicationId}`
        );
        const data = await res.json();
        setChecks(data.data || []);
        setPotential(data.potential || null);
      } catch (err) {
        console.error('Error loading Discover readiness:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_ready':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Discover Readiness
        </h1>
        <p className="text-gray-600">
          Otimize seu conteúdo para Google Discover
        </p>
      </div>

      {/* Discover Potential Overview */}
      {potential && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Tráfego Atual do Discover</span>
            <div className="text-3xl font-bold text-blue-600">
              {potential.current_discover_traffic.toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Potencial</span>
            <div className="text-3xl font-bold text-green-600">
              +{(potential.potential_discover_traffic - potential.current_discover_traffic).toLocaleString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Artigos Elegíveis</span>
            <div className="text-3xl font-bold text-gray-900">
              {potential.eligible_articles}/{potential.total_articles}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Elegibilidade</span>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round((potential.eligible_articles / potential.total_articles) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {potential && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8">
          <h3 className="font-semibold text-blue-900 mb-1">Recomendação</h3>
          <p className="text-sm text-blue-800">{potential.recommendation}</p>
        </div>
      )}

      {/* Discover Readiness Checks */}
      <div className="space-y-4">
        {checks.map((check, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {check.url}
                  </h3>
                  <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(check.readiness_status)}`}>
                    {check.readiness_status === 'ready' ? '✓ Pronto' : check.readiness_status === 'partial' ? '△ Parcial' : '✗ Não Pronto'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Score Geral</span>
                    <div className={`text-2xl font-bold ${getScoreColor(check.overall_score)}`}>
                      {check.overall_score.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Imagem</span>
                    <div className={`text-2xl font-bold ${getScoreColor(check.image_quality)}`}>
                      {check.image_quality.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">OG Tags</span>
                    <div className={`text-2xl font-bold ${check.og_tags_complete ? 'text-green-600' : 'text-red-600'}`}>
                      {check.og_tags_complete ? '✓' : '✗'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Frescor</span>
                    <div className={`text-2xl font-bold ${getScoreColor(check.content_freshness_score)}`}>
                      {check.content_freshness_score.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">CWV</span>
                    <div className={`text-2xl font-bold ${getScoreColor(check.core_web_vitals_score)}`}>
                      {check.core_web_vitals_score.toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Potential Traffic */}
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tráfego Potencial do Discover</span>
                    <span className="font-semibold text-green-600">
                      +{check.estimated_discover_traffic.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (check.estimated_discover_traffic / 500) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recommendations */}
                {check.recommendations.length > 0 && (
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2 text-sm">
                      Recomendações de Melhoria
                    </h4>
                    <ul className="space-y-1">
                      {check.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-orange-800">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {checks.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Nenhum artigo encontrado para análise.
          </p>
        </div>
      )}
    </div>
  );
}
