'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, AlertCircle } from 'lucide-react';

interface PerformanceData {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface KeywordData {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface Milestone {
  id: string;
  milestone_type: string;
  milestone_date: string;
  keyword?: string;
  new_value: number;
}

export default function PerformancePage() {
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_impressions: 0,
    total_clicks: 0,
    avg_ctr: 0,
    avg_position: 0,
  });

  useEffect(() => {
    async function fetchPerformanceData() {
      try {
        // Fetch search performance data
        const perfRes = await fetch('/api/performance?type=search');
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformance(perfData.data || []);

          // Calculate stats
          if (perfData.data && perfData.data.length > 0) {
            const totalImpressions = perfData.data.reduce(
              (sum: number, d: PerformanceData) => sum + d.impressions,
              0
            );
            const totalClicks = perfData.data.reduce(
              (sum: number, d: PerformanceData) => sum + d.clicks,
              0
            );
            const avgCtr =
              perfData.data.reduce(
                (sum: number, d: PerformanceData) => sum + d.ctr,
                0
              ) / perfData.data.length;
            const avgPosition =
              perfData.data.reduce(
                (sum: number, d: PerformanceData) => sum + d.position,
                0
              ) / perfData.data.length;

            setStats({
              total_impressions: totalImpressions,
              total_clicks: totalClicks,
              avg_ctr: Math.round(avgCtr * 100) / 100,
              avg_position: Math.round(avgPosition * 100) / 100,
            });
          }
        }

        // Fetch keyword data
        const keyRes = await fetch('/api/performance?type=keywords');
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          setKeywords(keyData.data || []);
        }

        // Fetch milestones
        const mileRes = await fetch('/api/performance?type=milestones');
        if (mileRes.ok) {
          const mileData = await mileRes.json();
          setMilestones(mileData.data || []);
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPerformanceData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando dados de desempenho...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Performance SEO
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Análise de desempenho no Google Search Console
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Impressões
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_impressions.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Clicks
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total_clicks.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                CTR Médio
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.avg_ctr}%
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Posição Média
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.avg_position.toFixed(1)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Top Keywords
        </h2>
        {keywords.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum dado de keyword disponível
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Keyword
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                    Posição
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                    Impressões
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {keywords.slice(0, 10).map((kw, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {kw.keyword}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        kw.position <= 3
                          ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200'
                          : kw.position <= 10
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {kw.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {kw.impressions}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {kw.clicks}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      {kw.ctr.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Milestones */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Marcos Recentes
        </h2>
        {milestones.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum marco registrado
          </p>
        ) : (
          <div className="space-y-3">
            {milestones.slice(0, 5).map(milestone => (
              <div
                key={milestone.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="pt-1">
                  {milestone.milestone_type.includes('ctr_increased') ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : milestone.milestone_type.includes('entered_top') ? (
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {milestone.milestone_type.replace(/_/g, ' ')}
                  </p>
                  {milestone.keyword && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Keyword: {milestone.keyword}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(milestone.milestone_date).toLocaleDateString(
                      'pt-BR'
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
