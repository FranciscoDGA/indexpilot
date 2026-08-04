'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface WastCategory {
  category: 'not_found' | 'soft_404' | 'redirect' | 'duplicate';
  count: number;
  estimated_crawl_waste: number;
  examples: string[];
  potential_savings: number;
  fix_strategy: string;
}

interface CrawlAnalysis {
  total_waste_urls: number;
  total_crawl_waste_percentage: number;
  by_category: WastCategory[];
  recommendations: string[];
}

interface CrawlStats {
  total_indexable_urls: number;
  estimated_monthly_crawls: number;
  crawl_waste_percentage: number;
  efficiency_score: number;
}

export default function CrawlBudgetAnalyzer() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [analysis, setAnalysis] = useState<CrawlAnalysis | null>(null);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/crawl-budget/analyze?publication_id=${publicationId}`
        );
        const data = await res.json();
        setAnalysis(data.data || null);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error loading crawl budget analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'not_found':
        return 'bg-red-100 text-red-800';
      case 'soft_404':
        return 'bg-orange-100 text-orange-800';
      case 'redirect':
        return 'bg-yellow-100 text-yellow-800';
      case 'duplicate':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'not_found':
        return '404 - Não Encontrado';
      case 'soft_404':
        return 'Soft 404';
      case 'redirect':
        return 'Redirecionamentos';
      case 'duplicate':
        return 'Duplicadas';
      default:
        return category;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Crawl Budget Analyzer
        </h1>
        <p className="text-gray-600">
          Otimize o orçamento de rastreamento do seu site
        </p>
      </div>

      {/* Efficiency Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Eficiência do Crawl</span>
            <div className={`text-3xl font-bold ${stats.efficiency_score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.efficiency_score}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">URLs Desperdiçadas</span>
            <div className="text-3xl font-bold text-red-600">
              {analysis?.total_waste_urls || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Crawl Waste %</span>
            <div className="text-3xl font-bold text-orange-600">
              {analysis?.total_crawl_waste_percentage || 0}%
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">URLs Indexáveis</span>
            <div className="text-3xl font-bold text-gray-900">
              {stats.total_indexable_urls.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">Principais Recomendações</h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-800">
                <span className="font-semibold">{i + 1}.</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Waste by Category */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.by_category.map((category, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getCategoryLabel(category.category)}
                </h3>
                <span className={`px-3 py-1 rounded text-xs font-medium ${getCategoryColor(category.category)}`}>
                  {category.count} URLs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Crawl Desperdíçado</span>
                  <div className="text-2xl font-bold text-orange-600">
                    {category.estimated_crawl_waste}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Economia Potencial</span>
                  <div className="text-2xl font-bold text-green-600">
                    +{category.potential_savings}
                  </div>
                </div>
              </div>

              {/* Waste Bar */}
              <div className="bg-gray-50 p-3 rounded mb-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-600">Impacto do Desperdício</span>
                  <span className="text-gray-600">
                    {Math.round((category.estimated_crawl_waste / 1000) * 100)}% do orçamento
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (category.estimated_crawl_waste / 300) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Fix Strategy */}
              <div className="bg-green-50 p-3 rounded border border-green-200 mb-4">
                <h4 className="font-semibold text-green-900 text-sm mb-2">Estratégia de Correção</h4>
                <p className="text-sm text-green-800">{category.fix_strategy}</p>
              </div>

              {/* Examples */}
              {category.examples.length > 0 && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold text-gray-900 text-xs mb-2">Exemplos</h4>
                  <ul className="space-y-1">
                    {category.examples.slice(0, 3).map((example, i) => (
                      <li key={i} className="text-xs text-gray-700">
                        • {example}
                      </li>
                    ))}
                    {category.examples.length > 3 && (
                      <li className="text-xs text-gray-600 mt-1">
                        +{category.examples.length - 3} mais
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!analysis && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Nenhuma análise disponível no momento.
          </p>
        </div>
      )}
    </div>
  );
}
