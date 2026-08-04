'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ContentOpportunity {
  keyword: string;
  type: 'high_impression_gap' | 'low_position_high_traffic' | 'zero_click' | 'serp_gap';
  gsc_impressions: number;
  gsc_clicks: number;
  gsc_ctr: number;
  gsc_position: number;
  serp_position: number;
  competitor_count: number;
  content_length_recommendation: number;
  keyword_variations: string[];
  estimated_traffic_potential: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  brief: {
    title_suggestion: string;
    content_focus: string[];
    target_length: number;
  };
}

interface ContentGaps {
  total_opportunities: number;
  quick_wins: number;
  medium_effort: number;
  long_term: number;
  estimated_total_traffic: number;
  recommended_content_count: number;
}

interface ContentCalendarItem {
  month: string;
  recommended_posts: number;
  estimated_traffic_gain: number;
  target_keywords: string[];
}

export default function ContentOpportunityFinder() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [gaps, setGaps] = useState<ContentGaps | null>(null);
  const [calendar, setCalendar] = useState<ContentCalendarItem[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ContentOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [opportunitiesRes, gapsRes, calendarRes] = await Promise.all([
          fetch(
            `/api/oge/opportunities/finder?publication_id=${publicationId}&action=all`
          ),
          fetch(
            `/api/oge/opportunities/finder?publication_id=${publicationId}&action=gaps`
          ),
          fetch(
            `/api/oge/opportunities/finder?publication_id=${publicationId}&action=calendar`
          ),
        ]);

        if (opportunitiesRes.ok) {
          const oppData = await opportunitiesRes.json();
          setOpportunities(oppData.data || []);
        }
        if (gapsRes.ok) {
          const gapData = await gapsRes.json();
          setGaps(gapData.data);
        }
        if (calendarRes.ok) {
          const calData = await calendarRes.json();
          setCalendar(calData.data || []);
        }
      } catch (err) {
        console.error('Error loading opportunities:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  const getPriorityColor = (priority: string) => {
    if (priority === 'CRITICAL') return 'bg-red-100 text-red-800 border-l-4 border-red-600';
    if (priority === 'HIGH') return 'bg-orange-100 text-orange-800 border-l-4 border-orange-600';
    if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600';
    return 'bg-blue-100 text-blue-800 border-l-4 border-blue-600';
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'CRITICAL') return '🔴 CRÍTICO';
    if (priority === 'HIGH') return '🟠 ALTO';
    if (priority === 'MEDIUM') return '🟡 MÉDIO';
    return '🔵 BAIXO';
  };

  const getTypeEmoji = (type: string) => {
    if (type === 'high_impression_gap') return '📈';
    if (type === 'low_position_high_traffic') return '⭐';
    if (type === 'zero_click') return '🎯';
    return '🔍';
  };

  const getTypeLabel = (type: string) => {
    if (type === 'high_impression_gap') return 'Alto Impressões, Baixa Pos.';
    if (type === 'low_position_high_traffic') return 'Bom Ranking, Alto Tráfego';
    if (type === 'zero_click') return 'Zero Click';
    return 'Gap de SERP';
  };

  const filteredOpportunities =
    filterType === 'all'
      ? opportunities
      : opportunities.filter((opp) => opp.type === filterType);

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
          Content Opportunity Finder
        </h1>
        <p className="text-gray-600">
          Encontre oportunidades de conteúdo cruzando dados de GSC e SERP
        </p>
      </div>

      {/* Content Gaps Overview */}
      {gaps && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <span className="text-red-600 text-sm font-bold">CRÍTICOS</span>
            <div className="text-3xl font-bold text-red-700 mt-2">
              {gaps.quick_wins}
            </div>
            <div className="text-xs text-red-600 mt-1">Quick Wins</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <span className="text-orange-600 text-sm font-bold">MÉDIO ESFORÇO</span>
            <div className="text-3xl font-bold text-orange-700 mt-2">
              {gaps.medium_effort}
            </div>
            <div className="text-xs text-orange-600 mt-1">Médio/Alto</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <span className="text-blue-600 text-sm font-bold">LONGO PRAZO</span>
            <div className="text-3xl font-bold text-blue-700 mt-2">
              {gaps.long_term}
            </div>
            <div className="text-xs text-blue-600 mt-1">Baixa Prioridade</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 md:col-span-3">
            <span className="text-green-600 text-sm font-bold">TRÁFEGO POTENCIAL</span>
            <div className="text-3xl font-bold text-green-700 mt-2">
              +{gaps.estimated_total_traffic.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {gaps.recommended_content_count} artigos recomendados
            </div>
          </div>
        </div>
      )}

      {/* Content Calendar */}
      {calendar.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📅 Calendário de Conteúdo Recomendado
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {calendar.map((item, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200"
              >
                <h3 className="font-bold text-gray-900 mb-3">{item.month}</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 text-sm">Posts Recomendados</span>
                    <div className="text-2xl font-bold text-blue-600">
                      {item.recommended_posts}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Tráfego Estimado</span>
                    <div className="text-2xl font-bold text-green-600">
                      +{item.estimated_traffic_gain.toLocaleString()}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-xs text-gray-600 font-semibold">Keywords</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.target_keywords.slice(0, 3).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-xs font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                      {item.target_keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-300 text-gray-900 rounded text-xs font-medium">
                          +{item.target_keywords.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <label className="text-sm font-medium text-gray-700 mr-4">Filtrar por Tipo:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todas as Oportunidades</option>
          <option value="high_impression_gap">Alto Impressões, Baixa Pos.</option>
          <option value="low_position_high_traffic">Bom Ranking, Alto Tráfego</option>
          <option value="zero_click">Zero Click</option>
          <option value="serp_gap">Gap de SERP</option>
        </select>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-600">
            Nenhuma oportunidade encontrada com este filtro.
          </div>
        ) : (
          filteredOpportunities.map((opportunity, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-lg cursor-pointer transition-all hover:shadow-md ${getPriorityColor(
                opportunity.priority
              )}`}
              onClick={() => setSelectedOpportunity(opportunity)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {getTypeEmoji(opportunity.type)}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg">{opportunity.keyword}</h3>
                      <p className="text-sm opacity-75">
                        {getTypeLabel(opportunity.type)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    +{opportunity.estimated_traffic_potential.toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75">tráfego potencial</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                <div>
                  <span className="opacity-75">Impressões</span>
                  <div className="font-bold">
                    {opportunity.gsc_impressions.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="opacity-75">Posição</span>
                  <div className="font-bold">#{opportunity.gsc_position}</div>
                </div>
                <div>
                  <span className="opacity-75">CTR</span>
                  <div className="font-bold">{opportunity.gsc_ctr.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="opacity-75">Prioridade</span>
                  <div className="font-bold">{getPriorityBadge(opportunity.priority)}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {opportunity.keyword_variations.slice(0, 3).map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-white bg-opacity-40 rounded text-xs font-medium">
                    {kw}
                  </span>
                ))}
                {opportunity.keyword_variations.length > 3 && (
                  <span className="px-2 py-1 bg-white bg-opacity-40 rounded text-xs font-medium">
                    +{opportunity.keyword_variations.length - 3} variações
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedOpportunity.keyword}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getTypeLabel(selectedOpportunity.type)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Metrics */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  📊 Métricas Atuais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 text-sm">Impressões (GSC)</span>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedOpportunity.gsc_impressions.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 text-sm">Cliques (GSC)</span>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedOpportunity.gsc_clicks.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 text-sm">CTR</span>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {selectedOpportunity.gsc_ctr.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 text-sm">Posição</span>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      #{selectedOpportunity.gsc_position}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Brief */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  ✍️ Breve de Conteúdo
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <span className="text-gray-600 text-sm font-semibold">
                      Título Sugerido
                    </span>
                    <p className="text-gray-900 mt-1">
                      {selectedOpportunity.brief.title_suggestion}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-600 text-sm font-semibold">
                      Foco do Conteúdo
                    </span>
                    <ul className="mt-2 space-y-1">
                      {selectedOpportunity.brief.content_focus.map((focus, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-900">
                          <span className="mr-2">→</span>
                          <span>{focus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-600 text-sm font-semibold">
                      Comprimento Recomendado
                    </span>
                    <p className="text-gray-900 font-bold mt-1">
                      {selectedOpportunity.brief.target_length.toLocaleString()} palavras
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyword Variations */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  🔑 Variações de Keyword
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOpportunity.keyword_variations.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Opportunity Summary */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-900 mb-2">
                  💰 Impacto Potencial
                </h4>
                <p className="text-sm text-green-800">
                  <strong>+{selectedOpportunity.estimated_traffic_potential.toLocaleString()}</strong> impressões
                  potenciais com uma estratégia bem executada. Com <strong>{selectedOpportunity.competitor_count}</strong> competidores
                  neste keyword, o esforço é {selectedOpportunity.priority === 'CRITICAL' ? 'CRÍTICO' : 'importante'}.
                </p>
              </div>

              <button
                onClick={() => setSelectedOpportunity(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
