'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { InsightCard } from '@/components/intelligence/InsightCard';
import { Insight } from '@/types/intelligence';

export default function AlertsPage() {
  const [siteId] = useState('site-1');

  const [insights, setInsights] = useState<Insight[]>([]);
  const [critical, setCritical] = useState<Insight[]>([]);
  const [high, setHigh] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (!siteId) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/intelligence/insights?publication_id=${siteId}`
        );
        if (res.ok) {
          const data = await res.json();
          const allInsights = data.data || [];

          const filtered = showResolved
            ? allInsights
            : allInsights.filter((i: Insight) => i.status === 'open');

          setInsights(filtered);
          setCritical(filtered.filter((i: Insight) => i.priority === 'CRITICAL'));
          setHigh(filtered.filter((i: Insight) => i.priority === 'HIGH'));
        }
      } catch (error) {
        console.error('Erro ao carregar alertas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [siteId, showResolved]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando alertas...</p>
        </div>
      </div>
    );
  }

  const hasCritical = critical.length > 0;
  const hasHigh = high.length > 0;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Alertas e Notificações</h1>
        <p className="text-gray-600">Monitore problemas críticos e de alta prioridade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={hasCritical ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="text-sm">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${hasCritical ? 'text-red-600' : 'text-green-600'}`}>
              {critical.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {hasCritical ? 'Requerem ação imediata' : 'Nenhum problema crítico'}
            </p>
          </CardContent>
        </Card>

        <Card className={hasHigh ? 'border-orange-300 bg-orange-50' : ''}>
          <CardHeader>
            <CardTitle className="text-sm">Altas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${hasHigh ? 'text-orange-600' : 'text-green-600'}`}>
              {high.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {hasHigh ? 'Importante resolver' : 'Tudo sob controle'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.length}</div>
            <p className="text-xs text-gray-600 mt-1">Não resolvidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {insights.length === 0 ? '100' : '0'}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Do total geral</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Mostrar resolvidos</span>
        </label>
      </div>

      {hasCritical && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 text-white">CRÍTICO</Badge>
            <h2 className="text-xl font-bold">Alertas Críticos</h2>
            <span className="text-lg font-semibold text-red-600">({critical.length})</span>
          </div>
          <div className="space-y-4">
            {critical.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {hasHigh && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-600 text-white">ALTA PRIORIDADE</Badge>
            <h2 className="text-xl font-bold">Alertas de Alta Prioridade</h2>
            <span className="text-lg font-semibold text-orange-600">({high.length})</span>
          </div>
          <div className="space-y-4">
            {high.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {!hasCritical && !hasHigh && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-800 mb-2">
                ✓ Nenhum alerta crítico
              </p>
              <p className="text-gray-600">
                Seu site está em bom estado! Continue monitorando regularmente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
