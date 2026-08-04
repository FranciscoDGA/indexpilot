'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { InsightCard } from '@/components/intelligence/InsightCard';
import { RecommendationList } from '@/components/intelligence/RecommendationList';
import { HealthScoreGauge } from '@/components/intelligence/HealthScoreGauge';
import { Insight, Recommendation, SeoHealthScore } from '@/types/intelligence';

export default function IntelligencePage() {
  const [siteId] = useState('site-1');

  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [healthScore, setHealthScore] = useState<SeoHealthScore>({
    overall_health: 0,
    growth_potential: 0,
    index_velocity: 0,
    content_freshness: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Generate insights
        const generateRes = await fetch('/api/intelligence/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publication_id: siteId }),
        });

        if (generateRes.ok) {
          const generateData = await generateRes.json();
          setInsights(generateData.insights || []);
          setRecommendations(generateData.recommendations || []);
          setHealthScore(generateData.health_scores);
        }

        // Fetch insights
        const insightsRes = await fetch(
          `/api/intelligence/insights?publication_id=${siteId}`
        );
        if (insightsRes.ok) {
          const data = await insightsRes.json();
          setInsights(data.data || []);
        }

        // Fetch recommendations
        const recsRes = await fetch(
          `/api/intelligence/recommendations?publication_id=${siteId}`
        );
        if (recsRes.ok) {
          const data = await recsRes.json();
          setRecommendations(data.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const filteredInsights = selectedPriority
    ? insights.filter(i => i.priority === selectedPriority)
    : insights;

  const criticalCount = insights.filter(i => i.priority === 'CRITICAL').length;
  const highCount = insights.filter(i => i.priority === 'HIGH').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centro de Inteligência</h1>
          <p className="text-gray-600">Análise completa de SEO e recomendações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthScoreGauge score={healthScore} />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Insights Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-gray-600 mt-2">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {recommendations.length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Recomendações ordenadas por ROI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Insights Detectadas</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPriority(null)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedPriority === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  Todas ({insights.length})
                </button>
                {criticalCount > 0 && (
                  <button
                    onClick={() => setSelectedPriority('CRITICAL')}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedPriority === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Críticas ({criticalCount})
                  </button>
                )}
                {highCount > 0 && (
                  <button
                    onClick={() => setSelectedPriority('HIGH')}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedPriority === 'HIGH'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    Altas ({highCount})
                  </button>
                )}
              </div>
            </div>

            {filteredInsights.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">
                    Nenhuma insight encontrada com este filtro.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Recomendações Top</h2>
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 text-sm">
                    Nenhuma recomendação disponível.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <RecommendationList
                recommendations={recommendations.slice(0, 5)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
