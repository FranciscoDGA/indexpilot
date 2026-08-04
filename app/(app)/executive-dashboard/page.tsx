'use client';

import { useState, useEffect } from 'react';
import { ExecutiveDashboard } from '@/components/intelligence/ExecutiveDashboard';
import { SeoHealthScore, Insight, Recommendation } from '@/types/intelligence';
import { Card, CardContent } from '@/components/common/Card';

export default function ExecutiveDashboardPage() {
  const [siteId] = useState('site-1');
  const [healthScores, setHealthScores] = useState<SeoHealthScore>({
    overall_health: 0,
    growth_potential: 0,
    index_velocity: 0,
    content_freshness: 0,
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generate insights
        const generateRes = await fetch('/api/intelligence/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publication_id: siteId }),
        });

        if (!generateRes.ok) {
          throw new Error('Erro ao gerar insights');
        }

        const generateData = await generateRes.json();
        setInsights(generateData.insights || []);
        setRecommendations(generateData.recommendations || []);
        setHealthScores(generateData.health_scores);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    if (siteId) {
      fetchData();
    }
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard executivo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-8">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              Erro ao carregar dashboard: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <ExecutiveDashboard
        siteId={siteId}
        healthScores={healthScores}
        insights={insights}
        recommendations={recommendations}
      />
    </div>
  );
}
