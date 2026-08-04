'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { RecommendationList } from '@/components/intelligence/RecommendationList';
import { Recommendation } from '@/types/intelligence';

export default function OpportunitiesPage() {
  const [siteId] = useState('site-1');

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecs, setFilteredRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEffort, setSelectedEffort] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/intelligence/recommendations?publication_id=${siteId}`
        );
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.data || []).sort((a: Recommendation, b: Recommendation) => b.score - a.score);
          setRecommendations(sorted);
          setFilteredRecs(sorted);
        }
      } catch (error) {
        console.error('Erro ao carregar recomendações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [siteId]);

  useEffect(() => {
    let filtered = recommendations;

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (selectedEffort) {
      filtered = filtered.filter(r => r.estimated_effort === selectedEffort);
    }

    setFilteredRecs(filtered);
  }, [selectedCategory, selectedEffort, recommendations]);

  const categories = Array.from(new Set(recommendations.map(r => r.category)));
  const efforts = Array.from(new Set(recommendations.map(r => r.estimated_effort)));

  const quickWins = recommendations.filter(
    r => r.estimated_effort === '5_MIN' && r.score >= 80
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando oportunidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Oportunidades de SEO</h1>
        <p className="text-gray-600">Recomendações priorizadas por impacto vs esforço</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recommendations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Wins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{quickWins.length}</div>
            <p className="text-xs text-gray-600 mt-1">5 min, alto impacto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(
                recommendations.reduce((acc, r) => acc + r.score, 0) /
                  Math.max(1, recommendations.length)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {recommendations.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold mb-3">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Esforço</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedEffort(null)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedEffort === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  Todos
                </button>
                {efforts.map(effort => (
                  <button
                    key={effort}
                    onClick={() => setSelectedEffort(effort)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedEffort === effort
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {effort}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">
            Recomendações ({filteredRecs.length})
          </h2>
          {filteredRecs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">
                  Nenhuma recomendação encontrada com esses filtros.
                </p>
              </CardContent>
            </Card>
          ) : (
            <RecommendationList recommendations={filteredRecs} />
          )}
        </div>
      </div>
    </div>
  );
}
