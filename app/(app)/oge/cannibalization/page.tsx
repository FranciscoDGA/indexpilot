'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CannibalizedKeyword {
  keyword: string;
  urls: Array<{
    url: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  total_impressions: number;
  visibility_loss: number;
  recommended_action: 'merge' | 'redirect' | 'change_intent';
  impact_estimate: number;
}

interface CannonStats {
  total_cannibalizations: number;
  critical_cannibalizations: number;
  total_visibility_loss: number;
  most_affected_keyword: string;
}

export default function Cannibalization() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [cannibalizations, setCannibalizations] = useState<CannibalizedKeyword[]>([]);
  const [stats, setStats] = useState<CannonStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/cannibalization/detect?publication_id=${publicationId}`
        );
        const data = await res.json();
        setCannibalizations(data.data || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error loading cannibalization data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'merge':
        return 'bg-blue-100 text-blue-800';
      case 'redirect':
        return 'bg-orange-100 text-orange-800';
      case 'change_intent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'merge':
        return 'Mesclar Conteúdo';
      case 'redirect':
        return 'Redirecionar';
      case 'change_intent':
        return 'Alterar Intenção';
      default:
        return action;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Keyword Cannibalization
        </h1>
        <p className="text-gray-600">
          Detecte e resolva keywords canibalizadas
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Total de Canibalizações</span>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total_cannibalizations}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Críticas</span>
            <div className="text-3xl font-bold text-red-600">
              {stats.critical_cannibalizations}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Perda de Visibilidade</span>
            <div className="text-3xl font-bold text-orange-600">
              {stats.total_visibility_loss.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Mais Afetado</span>
            <div className="text-lg font-bold text-gray-900 truncate">
              {stats.most_affected_keyword}
            </div>
          </div>
        </div>
      )}

      {/* Cannibalization List */}
      <div className="space-y-4">
        {cannibalizations.map((cann, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {cann.keyword}
                  </h3>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getActionColor(cann.recommended_action)}`}>
                    {getActionLabel(cann.recommended_action)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">URLs Competindo</span>
                    <div className="text-2xl font-bold text-gray-900">
                      {cann.urls.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Impressões Totais</span>
                    <div className="text-2xl font-bold text-gray-900">
                      {cann.total_impressions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Perda de Visibilidade</span>
                    <div className="text-2xl font-bold text-red-600">
                      {cann.visibility_loss.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Impacto Estimado</span>
                    <div className="text-2xl font-bold text-orange-600">
                      {cann.impact_estimate.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Competing URLs */}
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    URLs Competindo
                  </h4>
                  <div className="space-y-2">
                    {cann.urls.map((url, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-white rounded border border-gray-200">
                        <div className="flex-1 truncate">
                          <span className="text-gray-700 truncate">{url.url}</span>
                        </div>
                        <div className="flex gap-4 text-right ml-4 whitespace-nowrap">
                          <span className="text-gray-600">
                            Posição: <strong>#{url.position}</strong>
                          </span>
                          <span className="text-gray-600">
                            Impressões: <strong>{url.impressions.toLocaleString()}</strong>
                          </span>
                          <span className="text-gray-600">
                            CTR: <strong>{url.ctr.toFixed(2)}%</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Visualization */}
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-900 font-semibold">Impacto de Canibalizando</span>
                    <span className="text-red-900 font-semibold">
                      {cann.impact_estimate.toLocaleString()} impressões perdidas
                    </span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (cann.impact_estimate / 20000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                Implementar Resolução
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                Ver Análise Detalhada
              </button>
            </div>
          </div>
        ))}
      </div>

      {cannibalizations.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Parabéns! Nenhuma canibalizacao de keywords detectada.
          </p>
        </div>
      )}
    </div>
  );
}
