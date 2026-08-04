'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DomainTrust {
  crawl_trust_score: number;
  discovery_speed_score: number;
  index_velocity_score: number;
  impression_velocity_score: number;
  click_velocity_score: number;
  growth_consistency_score: number;
  content_freshness_score: number;
  technical_health_score: number;
  overall_domain_trust: number;
  trend_direction: 'up' | 'stable' | 'down';
  trend_percentage: number;
}

export default function DomainTrustEvolution() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [trust, setTrust] = useState<DomainTrust | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/domain-trust/evolution?publication_id=${publicationId}`
        );
        const data = await res.json();
        if (data.current) {
          setTrust(data.current);
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error('Error loading trust data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!trust) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded">
          Erro ao carregar dados de confiança do domínio
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const components = [
    {
      name: 'Crawl Trust',
      score: trust.crawl_trust_score,
      description: 'Com frequência o Googlebot visita seu site',
      hint: 'Mais conteúdo = mais rastreamentos',
    },
    {
      name: 'Discovery Speed',
      score: trust.discovery_speed_score,
      description: 'Horas do primeiro rastreamento até descoberta',
      hint: 'Ideal: menos de 2 horas',
    },
    {
      name: 'Index Velocity',
      score: trust.index_velocity_score,
      description: 'Horas do rastreamento até indexação',
      hint: 'Menor = melhor (indicador de confiança)',
    },
    {
      name: 'Impression Velocity',
      score: trust.impression_velocity_score,
      description: 'Horas da indexação até aparecer no SERP',
      hint: 'Visibilidade mais rápida = confiança maior',
    },
    {
      name: 'Click Velocity',
      score: trust.click_velocity_score,
      description: 'Horas do SERP até primeiro clique',
      hint: 'CTR rápido = confiança maior',
    },
    {
      name: 'Growth Consistency',
      score: trust.growth_consistency_score,
      description: '% de semanas com melhoria',
      hint: 'Crescimento consistente > crescimento esporádico',
    },
    {
      name: 'Content Freshness',
      score: trust.content_freshness_score,
      description: '% de conteúdo atualizado recentemente',
      hint: 'Atualizações regulares = melhor confiança',
    },
    {
      name: 'Technical Health',
      score: trust.technical_health_score,
      description: 'Score de SEO técnico + Core Web Vitals',
      hint: 'Site rápido e saudável = mais rastreável',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Domain Trust Evolution
        </h1>
        <p className="text-gray-600">
          Único do OGE: rastreie a evolução de confiança do seu domínio com 8 componentes
        </p>
      </div>

      {/* Overall Trust Score */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 text-center">
        <div className="inline-block">
          <div className={`text-7xl font-bold ${getScoreColor(trust.overall_domain_trust)} mb-4`}>
            {trust.overall_domain_trust}
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Confiança Geral do Domínio
          </div>
          <div className={`text-2xl font-bold ${getTrendColor(trust.trend_direction)} mb-4`}>
            {getTrendIcon(trust.trend_direction)} {Math.abs(trust.trend_percentage).toFixed(1)}%
          </div>
          <p className="text-gray-600">
            {trust.trend_direction === 'up'
              ? 'Confiança aumentando'
              : trust.trend_direction === 'down'
                ? 'Confiança em declínio'
                : 'Confiança estável'}
          </p>
        </div>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {components.map((comp, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{comp.name}</h3>

            <div className={`text-4xl font-bold ${getScoreColor(comp.score)} mb-3`}>
              {Math.round(comp.score)}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${comp.score}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-600 mb-2">{comp.description}</p>
            <div className="text-xs bg-blue-50 p-2 rounded text-blue-800">
              💡 {comp.hint}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-green-900 mb-4">
            Recomendações de Melhoria
          </h2>
          <ul className="space-y-3">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start text-green-800">
                <span className="mr-3 text-lg">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What Each Component Means */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Entenda Cada Componente
        </h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-bold text-gray-900">Crawl Trust (15%)</h3>
            <p>
              Quantas vezes o Googlebot rastreia seu site. Sites mais confiáveis são rastreados
              com mais frequência. Mais conteúdo = mais rastreamentos.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Discovery Speed (12%)</h3>
            <p>
              Quanto tempo leva para o Google encontrar uma nova URL. Ideal: menos de 2 horas.
              URLs descobertas rapidamente indicam alta confiança.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Index Velocity (15%)</h3>
            <p>
              Quanto tempo leva do rastreamento até a indexação. Quanto mais rápido, mais
              confiança o Google tem no seu site.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Impression Velocity (15%)</h3>
            <p>
              Quanto tempo leva da indexação até aparecer no SERP. Sites confiáveis aparecem
              mais rápido nos resultados.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Click Velocity (12%)</h3>
            <p>
              Quanto tempo leva do SERP até o primeiro clique. CTR rápido indica conteúdo
              relevante que atrai cliques imediatos.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Growth Consistency (15%)</h3>
            <p>
              Percentual de semanas mostrando melhoria. Crescimento consistente é mais
              importante que crescimento esporádico.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Content Freshness (12%)</h3>
            <p>
              Percentual de conteúdo atualizado recentemente. Atualizações regulares indicam
              site ativo e confiável.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900">Technical Health (4%)</h3>
            <p>
              Score de SEO técnico + Core Web Vitals. Sites rápidos e sem erros técnicos são
              mais rastreáveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
