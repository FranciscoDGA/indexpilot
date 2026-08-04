'use client';

import { Insight, Priority } from '@/types/intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
};

const priorityLabels: Record<Priority, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  return (
    <Card className={`border-l-4 ${priorityColors[insight.priority].split(' ')[0]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{insight.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={priorityColors[insight.priority]}>
                {priorityLabels[insight.priority]}
              </Badge>
              <Badge className="bg-gray-100 text-gray-800">{insight.type}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{insight.description}</p>

        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-sm font-semibold text-blue-900">Recomendação:</p>
          <p className="text-sm text-blue-800">{insight.recommendation}</p>
        </div>

        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-500">Impacto: </span>
            <span className="font-semibold">{insight.estimated_impact}</span>
          </div>
          <div>
            <span className="text-gray-500">Esforço: </span>
            <span className="font-semibold">{insight.estimated_effort}</span>
          </div>
        </div>

        {insight.metrics && Object.keys(insight.metrics).length > 0 && (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-semibold mb-2">Detalhes:</p>
            {Object.entries(insight.metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {onDismiss && (
          <button
            onClick={() => onDismiss(insight.id || '')}
            className="text-sm text-gray-500 hover:text-gray-700 mt-2"
          >
            Descartar
          </button>
        )}
      </CardContent>
    </Card>
  );
}
