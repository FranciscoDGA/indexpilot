'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DecayAlert {
  url: string;
  metric_type: string;
  current_value: number;
  value_30d_ago: number;
  decay_percentage: number;
  alert_level: string;
  root_cause: string;
  recovery_recommendation: string;
  priority: string;
}

interface DecayStats {
  contentInDecay: number;
  criticalAlerts: number;
  highAlerts: number;
  avgDecayPercentage: number;
  mostCommonRootCause: string;
}

export default function ContentDecay() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [alerts, setAlerts] = useState<DecayAlert[]>([]);
  const [stats, setStats] = useState<DecayStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/decay/alerts?publication_id=${publicationId}`
        );
        const data = await res.json();
        setAlerts(data.data || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error loading decay alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'impressions':
        return 'Impressões';
      case 'clicks':
        return 'Cliques';
      case 'ctr':
        return 'CTR';
      case 'position':
        return 'Posição';
      default:
        return metric;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Content Decay Engine
        </h1>
        <p className="text-gray-600">
          Identifique e recupere conteúdo em declínio
        </p>
      </div>

      {/* Decay Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Conteúdo em Declínio</span>
            <div className="text-3xl font-bold text-red-600">
              {stats.contentInDecay}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Alertas Críticos</span>
            <div className="text-3xl font-bold text-red-600">
              {stats.criticalAlerts}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Alertas Altos</span>
            <div className="text-3xl font-bold text-orange-600">
              {stats.highAlerts}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Declínio Médio</span>
            <div className="text-3xl font-bold text-orange-600">
              {stats.avgDecayPercentage}%
            </div>
          </div>
        </div>
      )}

      {/* Decay Alerts */}
      <div className="space-y-4">
        {alerts.map((alert, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {alert.url}
                  </h3>
                  <span className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                </div>

                {/* Metric Type Badge */}
                <div className="inline-block mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getMetricLabel(alert.metric_type)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Valor Atual</span>
                    <div className="text-lg font-bold text-gray-900">
                      {alert.current_value.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Há 30 dias</span>
                    <div className="text-lg font-bold text-gray-900">
                      {alert.value_30d_ago.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Declínio</span>
                    <div className="text-lg font-bold text-red-600">
                      -{alert.decay_percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Decay Visualization */}
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taxa de Declínio</span>
                    <span className="font-semibold text-red-600">
                      {alert.decay_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, alert.decay_percentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Root Cause and Recovery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-1 text-sm">
                      Causa Raiz
                    </h4>
                    <p className="text-sm text-orange-800">
                      {alert.root_cause}
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-1 text-sm">
                      Recomendação de Recuperação
                    </h4>
                    <p className="text-sm text-green-800">
                      {alert.recovery_recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700">
                Implementar Recuperação
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                Ver Histórico
              </button>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600">
            Excelente! Nenhum conteúdo em declínio detectado.
          </p>
        </div>
      )}
    </div>
  );
}
