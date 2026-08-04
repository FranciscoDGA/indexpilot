'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CompetitorMetrics {
  domain: string;
  total_keywords_ranking: number;
  top_10_count: number;
  top_3_count: number;
  top_1_count: number;
  average_position: number;
  estimated_traffic: number;
  growth_percentage: number;
  new_content_this_month: number;
  latest_update: Date;
}

interface CompetitorGrowth {
  domain: string;
  keywords_gained_this_month: number;
  keywords_lost_this_month: number;
  net_growth: number;
  growth_rate: number;
  trend: 'accelerating' | 'stable' | 'declining';
}

interface CompetitorContent {
  title: string;
  url: string;
  publish_date: Date;
  estimated_traffic: number;
  ranking_keywords: number;
  initial_position: number;
}

interface CompetitorAlert {
  type: 'new_content' | 'rank_change' | 'backlink' | 'technical';
  severity: 'low' | 'medium' | 'high';
  description: string;
  date: Date;
}

interface CompetitorStrategy {
  primary_topics: string[];
  content_frequency: 'high' | 'medium' | 'low';
  content_depth: 'shallow' | 'medium' | 'deep';
  link_building_activity: 'high' | 'medium' | 'low';
  update_frequency: 'frequent' | 'occasional' | 'rare';
  recommendations: string[];
}

export default function CompetitorWatch() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [metrics, setMetrics] = useState<CompetitorMetrics | null>(null);
  const [growth, setGrowth] = useState<CompetitorGrowth | null>(null);
  const [newContent, setNewContent] = useState<CompetitorContent[]>([]);
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [strategy, setStrategy] = useState<CompetitorStrategy | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicationId) {
      // Load default competitors
      setCompetitors(['competitor1.com', 'competitor2.com', 'competitor3.com']);
    }
  }, [publicationId]);

  useEffect(() => {
    const loadCompetitorData = async () => {
      if (!selectedCompetitor) return;

      setLoading(true);
      try {
        const [metricsRes, growthRes, contentRes, alertsRes, strategyRes] = await Promise.all([
          fetch('/api/oge/competitors/watch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publication_id: publicationId,
              domain: selectedCompetitor,
              action: 'metrics',
            }),
          }),
          fetch('/api/oge/competitors/watch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publication_id: publicationId,
              domain: selectedCompetitor,
              action: 'growth',
            }),
          }),
          fetch('/api/oge/competitors/watch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publication_id: publicationId,
              domain: selectedCompetitor,
              action: 'new_content',
            }),
          }),
          fetch('/api/oge/competitors/watch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publication_id: publicationId,
              domain: selectedCompetitor,
              action: 'alerts',
            }),
          }),
          fetch('/api/oge/competitors/watch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publication_id: publicationId,
              domain: selectedCompetitor,
              action: 'strategy',
            }),
          }),
        ]);

        if (metricsRes.ok) setMetrics(await metricsRes.json().then(d => d.data));
        if (growthRes.ok) setGrowth(await growthRes.json().then(d => d.data));
        if (contentRes.ok) setNewContent(await contentRes.json().then(d => d.data || []));
        if (alertsRes.ok) setAlerts(await alertsRes.json().then(d => d.data || []));
        if (strategyRes.ok) setStrategy(await strategyRes.json().then(d => d.data));
      } catch (err) {
        console.error('Error loading competitor data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCompetitorData();
  }, [selectedCompetitor, publicationId]);

  const handleAddCompetitor = async () => {
    if (!newCompetitor) {
      alert('Please enter a domain');
      return;
    }

    try {
      await fetch('/api/oge/competitors/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publication_id: publicationId,
          domain: newCompetitor,
          action: 'add',
        }),
      });

      setCompetitors([...competitors, newCompetitor]);
      setSelectedCompetitor(newCompetitor);
      setNewCompetitor('');
    } catch (err) {
      console.error('Error adding competitor:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'high') return 'bg-red-100 text-red-800 border-red-300';
    if (severity === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'accelerating') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Competitor Watch
        </h1>
        <p className="text-gray-600">
          Monitore métricas, conteúdo e estratégia dos seus competidores
        </p>
      </div>

      {/* Add Competitor */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Adicionar Competidor
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domínio do Competidor
            </label>
            <input
              type="text"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              placeholder="competitor.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddCompetitor}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Competitors List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Competidores Monitorados
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {competitors.map((comp) => (
            <button
              key={comp}
              onClick={() => setSelectedCompetitor(comp)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCompetitor === comp
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-6 text-center text-gray-600">
          Carregando dados do competidor...
        </div>
      )}

      {selectedCompetitor && !loading && (
        <>
          {/* Competitor Metrics */}
          {metrics && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                📊 Métricas de {metrics.domain}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Total de Keywords</span>
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics.total_keywords_ranking.toLocaleString()}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Top 10</span>
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.top_10_count.toLocaleString()}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Top 3</span>
                  <div className="text-3xl font-bold text-purple-600">
                    {metrics.top_3_count.toLocaleString()}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Posição #1</span>
                  <div className="text-3xl font-bold text-orange-600">
                    {metrics.top_1_count.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">Tráfego Estimado</span>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.estimated_traffic.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Crescimento</span>
                  <div className={`text-2xl font-bold mt-2 ${metrics.growth_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.growth_percentage > 0 ? '+' : ''}{metrics.growth_percentage.toFixed(1)}%
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Novo Conteúdo (Mês)</span>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {metrics.new_content_this_month} posts
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Growth Analysis */}
          {growth && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📈 Crescimento do Mês
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">Keywords Ganhos</span>
                  <div className="text-3xl font-bold text-green-600">
                    +{growth.keywords_gained_this_month}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Keywords Perdidos</span>
                  <div className="text-3xl font-bold text-red-600">
                    -{growth.keywords_lost_this_month}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Crescimento Líquido</span>
                  <div className={`text-3xl font-bold ${growth.net_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growth.net_growth > 0 ? '+' : ''}{growth.net_growth}
                  </div>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Tendência</span>
                  <div className={`text-lg font-bold mt-2 ${getTrendColor(growth.trend)}`}>
                    {growth.trend === 'accelerating'
                      ? '🚀 Acelerando'
                      : growth.trend === 'declining'
                        ? '📉 Declínio'
                        : '➡️ Estável'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🚨 Alertas do Competidor
              </h2>

              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">
                          {alert.type === 'new_content'
                            ? '📝 Novo Conteúdo'
                            : alert.type === 'rank_change'
                              ? '📊 Mudança de Ranking'
                              : alert.type === 'backlink'
                                ? '🔗 Novo Backlink'
                                : '⚙️ Técnico'}
                        </div>
                        <div className="text-sm mt-1">{alert.description}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Content */}
          {newContent.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📚 Conteúdo Recente
              </h2>

              <div className="space-y-4">
                {newContent.slice(0, 5).map((content, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <a
                          href={content.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {content.title}
                        </a>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(content.publish_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {content.estimated_traffic.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">tráfego estimado</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Keywords Ranqueadas:</span>
                        <span className="font-semibold ml-2 text-gray-900">{content.ranking_keywords}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Posição Inicial:</span>
                        <span className="font-semibold ml-2 text-gray-900">#{content.initial_position}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategy Analysis */}
          {strategy && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                🎯 Análise de Estratégia
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Tópicos Principais</h3>
                  <div className="flex flex-wrap gap-2">
                    {strategy.primary_topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Frequência de Conteúdo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frequência:</span>
                      <span className="font-semibold text-gray-900">
                        {strategy.content_frequency === 'high'
                          ? '🔴 Alta'
                          : strategy.content_frequency === 'medium'
                            ? '🟡 Média'
                            : '🟢 Baixa'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profundidade:</span>
                      <span className="font-semibold text-gray-900">
                        {strategy.content_depth === 'deep'
                          ? '📊 Profundo'
                          : strategy.content_depth === 'medium'
                            ? '📈 Médio'
                            : '📝 Raso'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Link Building:</span>
                      <span className="font-semibold text-gray-900">
                        {strategy.link_building_activity === 'high'
                          ? '🔗 Intensa'
                          : strategy.link_building_activity === 'medium'
                            ? '🔗 Moderada'
                            : '🔗 Baixa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {strategy.recommendations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3">💡 Recomendações de Aprendizado</h4>
                  <ul className="space-y-2">
                    {strategy.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start text-blue-800">
                        <span className="mr-3">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
