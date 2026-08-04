'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SERPFeature {
  type: 'featured_snippet' | 'faq' | 'video' | 'news' | 'ai_overview';
  url?: string;
  title?: string;
  description?: string;
  presence: boolean;
}

interface SERPIntel {
  keyword: string;
  position: number;
  url: string;
  title: string;
  description: string;
  featured_snippets: SERPFeature[];
  faq: SERPFeature[];
  videos: SERPFeature[];
  news_items: SERPFeature[];
  ai_overview: SERPFeature[];
  serp_features_count: number;
  competition_level: 'low' | 'medium' | 'high';
  snippet_opportunity: boolean;
}

interface SnippetOpportunity {
  keyword: string;
  current_position: number;
  snippet_owned_by: string;
  snippet_type: 'table' | 'list' | 'paragraph';
  difficulty: 'easy' | 'medium' | 'hard';
  potential_impact: number;
}

interface AIOverviewAnalysis {
  keywords_with_ai_overview: number;
  ctr_impact_percentage: number;
  affected_sites_percentage: number;
  recommendation: string;
}

interface SERPWinner {
  keyword: string;
  change: 'won' | 'lost' | 'gained_feature';
  feature_type?: string;
  position_change?: number;
}

export default function SERPIntelligence() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [keyword, setKeyword] = useState('');
  const [serpData, setSerpData] = useState<SERPIntel | null>(null);
  const [snippetOpportunities, setSnippetOpportunities] = useState<SnippetOpportunity[]>([]);
  const [serpWinners, setSerpWinners] = useState<SERPWinner[]>([]);
  const [aiOverviewAnalysis, setAiOverviewAnalysis] = useState<AIOverviewAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'1_week' | '1_month' | '3_months'>('1_month');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [opportunitiesRes, winnersRes, aiRes] = await Promise.all([
          fetch(`/api/oge/serp/intelligence?publication_id=${publicationId}&action=snippets`),
          fetch(`/api/oge/serp/intelligence?publication_id=${publicationId}&action=winners&timeframe=${timeframe}`),
          fetch(`/api/oge/serp/intelligence?publication_id=${publicationId}&action=ai_overview`),
        ]);

        if (opportunitiesRes.ok) {
          const oppData = await opportunitiesRes.json();
          setSnippetOpportunities(oppData.data || []);
        }
        if (winnersRes.ok) {
          const winData = await winnersRes.json();
          setSerpWinners(winData.data || []);
        }
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          setAiOverviewAnalysis(aiData.data || null);
        }
      } catch (err) {
        console.error('Error loading SERP data:', err);
      }
    };

    if (publicationId) loadData();
  }, [publicationId, timeframe]);

  const handleAnalyzeKeyword = async () => {
    if (!keyword) {
      alert('Please enter a keyword');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/oge/serp/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publication_id: publicationId,
          keyword,
          action: 'analyze',
        }),
      });

      const data = await res.json();
      if (data.data) {
        setSerpData(data.data);
      }
    } catch (err) {
      console.error('Error analyzing keyword:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    if (level === 'low') return 'text-green-600';
    if (level === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-800';
    if (difficulty === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const featureEmoji = {
    featured_snippet: '💬',
    faq: '❓',
    video: '🎥',
    news: '📰',
    ai_overview: '🤖',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SERP Intelligence
        </h1>
        <p className="text-gray-600">
          Rastreie featured snippets, FAQs, vídeos e AI Overviews nos seus keywords
        </p>
      </div>

      {/* AI Overview Impact */}
      {aiOverviewAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🤖 AI Overview Impact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-600 text-sm">Keywords com AI Overview</span>
              <div className="text-3xl font-bold text-purple-600">
                {aiOverviewAnalysis.keywords_with_ai_overview}
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Impacto no CTR</span>
              <div className={`text-3xl font-bold ${aiOverviewAnalysis.ctr_impact_percentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {aiOverviewAnalysis.ctr_impact_percentage}%
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Sites Afetados</span>
              <div className="text-3xl font-bold text-blue-600">
                {aiOverviewAnalysis.affected_sites_percentage}%
              </div>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Recomendação</span>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {aiOverviewAnalysis.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Analyzer */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Analisar Keyword
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex: how to optimize for SEO"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeKeyword()}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAnalyzeKeyword}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
        </div>
      </div>

      {/* SERP Data Result */}
      {serpData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {serpData.keyword}
                </h3>
                <p className="text-sm text-gray-600">
                  {serpData.url}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">
                  {serpData.position}
                </div>
                <div className="text-sm text-gray-600">Posição</div>
              </div>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">
              Nível de Competição
            </h4>
            <div className={`inline-block text-lg font-bold ${getCompetitionColor(serpData.competition_level)}`}>
              {serpData.competition_level === 'low'
                ? '🟢 Baixa'
                : serpData.competition_level === 'medium'
                  ? '🟡 Média'
                  : '🔴 Alta'}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              SERP Features Presentes
            </h4>
            <div className="space-y-3">
              {serpData.featured_snippets.some((f) => f.presence) && (
                <div className="flex items-center p-3 bg-gray-50 rounded">
                  <span className="text-2xl mr-3">{featureEmoji.featured_snippet}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Featured Snippet</div>
                    <div className="text-sm text-gray-600">Snippet de destaque no SERP</div>
                  </div>
                  <div className="text-green-600 font-bold">Presente</div>
                </div>
              )}

              {serpData.faq.some((f) => f.presence) && (
                <div className="flex items-center p-3 bg-gray-50 rounded">
                  <span className="text-2xl mr-3">{featureEmoji.faq}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">FAQ Schema</div>
                    <div className="text-sm text-gray-600">{serpData.faq.length} FAQ items detectadas</div>
                  </div>
                  <div className="text-green-600 font-bold">Presente</div>
                </div>
              )}

              {serpData.videos.some((f) => f.presence) && (
                <div className="flex items-center p-3 bg-gray-50 rounded">
                  <span className="text-2xl mr-3">{featureEmoji.video}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Vídeos</div>
                    <div className="text-sm text-gray-600">Carousel de vídeos no SERP</div>
                  </div>
                  <div className="text-green-600 font-bold">Presente</div>
                </div>
              )}

              {serpData.news_items.some((f) => f.presence) && (
                <div className="flex items-center p-3 bg-gray-50 rounded">
                  <span className="text-2xl mr-3">{featureEmoji.news}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">News Box</div>
                    <div className="text-sm text-gray-600">Notícias relevantes</div>
                  </div>
                  <div className="text-green-600 font-bold">Presente</div>
                </div>
              )}

              {serpData.ai_overview.some((f) => f.presence) && (
                <div className="flex items-center p-3 bg-purple-50 rounded">
                  <span className="text-2xl mr-3">{featureEmoji.ai_overview}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">AI Overview</div>
                    <div className="text-sm text-gray-600">Resumo gerado por IA</div>
                  </div>
                  <div className="text-purple-600 font-bold">Presente</div>
                </div>
              )}

              {serpData.serp_features_count === 0 && (
                <div className="p-3 bg-gray-50 rounded text-gray-600 text-sm">
                  Sem features especiais detectadas
                </div>
              )}
            </div>
          </div>

          {serpData.snippet_opportunity && (
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h5 className="font-bold text-green-900">✅ Oportunidade de Snippet Detectada</h5>
              <p className="text-sm text-green-800 mt-1">
                Você tem potencial para ganhar um featured snippet neste keyword. Foque em respostas diretas e bem estruturadas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SERP Winners & Losers */}
      {serpWinners.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Winners & Losers
            </h2>
            <div>
              <label className="text-sm text-gray-600 mr-2">Período:</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="1_week">Última Semana</option>
                <option value="1_month">Último Mês</option>
                <option value="3_months">Últimos 3 Meses</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {serpWinners.map((winner, idx) => (
              <div
                key={idx}
                className={`p-4 rounded border ${
                  winner.change === 'won'
                    ? 'bg-green-50 border-green-200'
                    : winner.change === 'lost'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {winner.change === 'won'
                        ? '🏆 Ganhou'
                        : winner.change === 'lost'
                          ? '📉 Perdeu'
                          : '🎁 Ganhou Feature'}
                    </div>
                    <div className="text-gray-700 font-medium">{winner.keyword}</div>
                    {winner.feature_type && (
                      <div className="text-sm text-gray-600 mt-1">
                        Feature: {winner.feature_type}
                      </div>
                    )}
                  </div>
                  {winner.position_change && (
                    <div className={`text-lg font-bold ${winner.position_change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {winner.position_change > 0 ? '+' : ''}{winner.position_change}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snippet Opportunities */}
      {snippetOpportunities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💬 Oportunidades de Featured Snippet
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-900">Keyword</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Posição</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Tipo</th>
                  <th className="text-left p-3 font-semibold text-gray-900">Dificuldade</th>
                  <th className="text-right p-3 font-semibold text-gray-900">Impacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {snippetOpportunities.map((opp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3">{opp.keyword}</td>
                    <td className="p-3">#{opp.current_position}</td>
                    <td className="p-3 text-xs">
                      {opp.snippet_type === 'table'
                        ? '📊 Table'
                        : opp.snippet_type === 'list'
                          ? '📝 List'
                          : '📄 Paragraph'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(opp.difficulty)}`}>
                        {opp.difficulty === 'easy'
                          ? 'Fácil'
                          : opp.difficulty === 'medium'
                            ? 'Médio'
                            : 'Difícil'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold text-green-600">
                        +{opp.potential_impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
