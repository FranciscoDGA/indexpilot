'use client';

import { SeoHealthScore } from '@/types/intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

interface HealthScoreGaugeProps {
  score: SeoHealthScore;
}

function ScoreGauge({ label, value }: { label: string; value: number }) {
  const percentage = Math.min(100, Math.max(0, value));
  const color =
    percentage >= 80 ? 'bg-green-500' :
    percentage >= 60 ? 'bg-blue-500' :
    percentage >= 40 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-lg font-bold">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function HealthScoreGauge({ score }: HealthScoreGaugeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saúde SEO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {score.overall_health}%
          </div>
          <p className="text-gray-600">Saúde Geral</p>
        </div>

        <div className="space-y-4">
          <ScoreGauge
            label="Potencial de Crescimento"
            value={score.growth_potential}
          />
          <ScoreGauge
            label="Velocidade de Índice"
            value={score.index_velocity}
          />
          <ScoreGauge
            label="Frescor de Conteúdo"
            value={score.content_freshness}
          />
        </div>

        <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
          <p className="text-blue-900">
            Seu site tem uma saúde SEO em nível {score.overall_health >= 80 ? 'excelente' : score.overall_health >= 60 ? 'bom' : score.overall_health >= 40 ? 'moderado' : 'crítico'}. Continue melhorando os indicadores para aumentar a visibilidade nos buscadores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
