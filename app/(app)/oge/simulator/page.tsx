'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SimulationResult {
  url: string;
  predictions: {
    impressions: { min: number; expected: number; max: number };
    clicks: { min: number; expected: number; max: number };
  };
  probabilities: {
    top_10: number;
    top_5: number;
    snippet: number;
  };
  timeline: {
    first_change_days: number;
    half_impact_days: number;
    full_impact_days: number;
    peak_days: number;
  };
  confidence: number;
  priority: string;
}

export default function GrowthSimulator() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [accuracy, setAccuracy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [changeType, setChangeType] = useState('title');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load prediction accuracy
        const accuracyRes = await fetch(
          `/api/oge/simulator/predict?publication_id=${publicationId}&action=accuracy`
        );
        const accuracyData = await accuracyRes.json();
        setAccuracy(accuracyData.data);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  const handleSimulate = async () => {
    if (!selectedUrl) {
      alert('Please select a URL');
      return;
    }

    try {
      const res = await fetch('/api/oge/simulator/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publication_id: publicationId,
          url: selectedUrl,
          changes: { update_type: changeType },
          action: 'predict',
        }),
      });

      const data = await res.json();
      if (data.data) {
        setResults([data.data]);
      }
    } catch (err) {
      console.error('Error running simulation:', err);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Growth Simulator
        </h1>
        <p className="text-gray-600">
          Preveja o impacto de mudanças com base nos dados históricos do seu site
        </p>
      </div>

      {/* Accuracy Overview */}
      {accuracy && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Total de Previsões</span>
            <div className="text-3xl font-bold text-gray-900">
              {accuracy.total_predictions}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Previsões Precisas</span>
            <div className="text-3xl font-bold text-green-600">
              {accuracy.accurate_predictions}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Precisão Geral</span>
            <div className="text-3xl font-bold text-blue-600">
              {accuracy.accuracy_percentage}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Tendência do Modelo</span>
            <div className={`text-lg font-bold ${accuracy.model_improvement_trend === 'improving' ? 'text-green-600' : 'text-gray-600'}`}>
              {accuracy.model_improvement_trend === 'improving' ? '↑ Melhorando' : '→ Estável'}
            </div>
          </div>
        </div>
      )}

      {/* Simulator Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Simular Mudança
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Artigo
            </label>
            <input
              type="text"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              placeholder="https://seu-site.com/artigo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Mudança
            </label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="title">Atualizar Título</option>
              <option value="description">Atualizar Meta Description</option>
              <option value="content">Atualizar Conteúdo</option>
              <option value="links">Adicionar Links</option>
              <option value="technical">Melhoria Técnica</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Simular Impacto
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((result, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Previsão de Impacto
                </h3>
                <p className="text-sm text-gray-600">
                  {result.url}
                </p>
              </div>

              {/* Impressions Prediction */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Impressões
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.predictions.impressions.min.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Mínimo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      +{(result.predictions.impressions.expected - 100).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Esperado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.predictions.impressions.max.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Máximo</div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: '65%' }}
                  ></div>
                </div>
              </div>

              {/* Clicks Prediction */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Cliques
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {result.predictions.clicks.min.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Mínimo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      +{(result.predictions.clicks.expected - 10).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Esperado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.predictions.clicks.max.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Máximo</div>
                  </div>
                </div>
              </div>

              {/* Success Probabilities */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Probabilidade de Sucesso
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Top 10</span>
                      <span className="font-bold text-gray-900">
                        {Math.round(result.probabilities.top_10 * 100)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${result.probabilities.top_10 * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Top 5</span>
                      <span className="font-bold text-gray-900">
                        {Math.round(result.probabilities.top_5 * 100)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${result.probabilities.top_5 * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Featured Snippet</span>
                      <span className="font-bold text-gray-900">
                        {Math.round(result.probabilities.snippet * 100)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${result.probabilities.snippet * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Timeline de Impacto
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Primeira mudança:</span>
                    <span className="font-semibold">{result.timeline.first_change_days}-7 dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Metade do impacto:</span>
                    <span className="font-semibold">{result.timeline.half_impact_days}-21 dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Impacto completo:</span>
                    <span className="font-semibold">{result.timeline.full_impact_days}-45 dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pico:</span>
                    <span className="font-semibold">{result.timeline.peak_days}+ dias</span>
                  </div>
                </div>
              </div>

              {/* Confidence & Priority */}
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-blue-900">Confiança</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      {result.confidence}% (Baseado em histórico do seu site)
                    </p>
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    {result.priority}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Selecione uma URL e tipo de mudança para ver a previsão de impacto
          </p>
        </div>
      )}
    </div>
  );
}
