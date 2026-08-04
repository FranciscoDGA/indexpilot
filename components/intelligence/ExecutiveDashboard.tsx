'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { SeoHealthScore, Insight, Recommendation } from '@/types/intelligence';

interface ExecutiveDashboardProps {
  siteId: string;
  healthScores: SeoHealthScore;
  insights: Insight[];
  recommendations: Recommendation[];
}

export function ExecutiveDashboard({
  siteId,
  healthScores,
  insights,
  recommendations,
}: ExecutiveDashboardProps) {
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const criticalCount = insights.filter(i => i.priority === 'CRITICAL').length;
  const highCount = insights.filter(i => i.priority === 'HIGH').length;
  const avgRoiScore = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length)
    : 0;

  const quickWinsCount = recommendations.filter(
    r => r.estimated_effort === '5_MIN' && r.score >= 80
  ).length;

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Bom', color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { label: 'Moderado', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Crítico', color: 'bg-red-100 text-red-800' };
  };

  const healthStatus = getHealthStatus(healthScores.overall_health);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Dashboard Executivo</h1>
          <p className="text-gray-600 mt-1">
            Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <Badge className={healthStatus.color}>
          {healthStatus.label}
        </Badge>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Saúde SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {healthScores.overall_health}%
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {healthStatus.label}
            </p>
          </CardContent>
        </Card>

        <Card className={criticalCount > 0 ? 'border-red-200' : 'border-green-200'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {criticalCount}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {criticalCount > 0 ? 'Ação necessária' : 'Nenhum problema'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">
              {recommendations.length}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ROI Médio: {avgRoiScore}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Quick Wins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {quickWinsCount}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              5 min, alto impacto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Potencial de Crescimento</span>
                <span className="text-sm font-bold">{healthScores.growth_potential}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${healthScores.growth_potential}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Velocidade de Índice</span>
                <span className="text-sm font-bold">{healthScores.index_velocity}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${healthScores.index_velocity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Frescor de Conteúdo</span>
                <span className="text-sm font-bold">{healthScores.content_freshness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: `${healthScores.content_freshness}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Prioridades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Críticas</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 bg-red-200 rounded">
                  <div
                    className="h-3 bg-red-600 rounded"
                    style={{ width: `${(criticalCount / Math.max(1, insights.length)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-6">{criticalCount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Altas</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 bg-orange-200 rounded">
                  <div
                    className="h-3 bg-orange-600 rounded"
                    style={{ width: `${(highCount / Math.max(1, insights.length)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-6">{highCount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Médias</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 bg-yellow-200 rounded">
                  <div
                    className="h-3 bg-yellow-600 rounded"
                    style={{
                      width: `${((insights.filter(i => i.priority === 'MEDIUM').length) / Math.max(1, insights.length)) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-6">
                  {insights.filter(i => i.priority === 'MEDIUM').length}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Baixas</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 bg-green-200 rounded">
                  <div
                    className="h-3 bg-green-600 rounded"
                    style={{
                      width: `${((insights.filter(i => i.priority === 'LOW').length) / Math.max(1, insights.length)) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-6">
                  {insights.filter(i => i.priority === 'LOW').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Oportunidades por ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec, idx) => (
              <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{idx + 1}. {rec.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{rec.score}</div>
                  <p className="text-xs text-gray-500">ROI</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Impacto Muito Alto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {recommendations.filter(r => r.estimated_impact === 'VERY_HIGH').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Oportunidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">5 Minutos de Esforço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {recommendations.filter(r => r.estimated_effort === '5_MIN').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ações rápidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Apenas Descobertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {insights.filter(i => i.status === 'open').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Não resolvidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Saúde Geral:</strong> {healthStatus.label} ({healthScores.overall_health}%)
          </p>
          <p>
            <strong>Problemas Críticos:</strong> {criticalCount} {criticalCount === 0 ? '✓' : '⚠️'}
          </p>
          <p>
            <strong>Oportunidades Totais:</strong> {recommendations.length} com ROI médio {avgRoiScore}
          </p>
          <p>
            <strong>Quick Wins Disponíveis:</strong> {quickWinsCount} ações em menos de 2 minutos cada
          </p>
          <p className="pt-2 border-t border-blue-200">
            <strong>Recomendação:</strong> {
              criticalCount > 0
                ? 'Resolver alertas críticos imediatamente'
                : quickWinsCount > 0
                ? `Executar ${quickWinsCount} quick wins para ganhos rápidos`
                : 'Site em bom estado. Continuar monitoramento regular'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
