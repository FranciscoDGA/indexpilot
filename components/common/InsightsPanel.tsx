'use client';

import { Brain, TrendingUp, Clock, AlertTriangle, BarChart3, Zap } from 'lucide-react';

interface Insight {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'tip';
}

const defaultInsights: Insight[] = [
  { id: '1', text: 'Você indexou 18% mais rápido que semana passada.', type: 'positive' },
  { id: '2', text: 'O cluster SEO Técnico cresceu 12%.', type: 'positive' },
  { id: '3', text: 'A maior parte dos erros está concentrada no sitemap.', type: 'neutral' },
  { id: '4', text: 'Seu tempo médio de indexação caiu para 4 horas.', type: 'positive' },
  { id: '5', text: '3 URLs com bounce rate acima de 80% detectadas.', type: 'tip' },
];

const typeConfig = {
  positive: { icon: <TrendingUp size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-200' },
  negative: { icon: <AlertTriangle size={14} />, color: 'text-red-500', bg: 'bg-red-500/5 border-red-200' },
  neutral: { icon: <BarChart3 size={14} />, color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-200' },
  tip: { icon: <Zap size={14} />, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-200' },
};

export function InsightsPanel({ insights = defaultInsights }: { insights?: Insight[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-purple-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insights IA</h3>
      </div>
      <div className="space-y-2">
        {insights.slice(0, 5).map(insight => {
          const cfg = typeConfig[insight.type];
          return (
            <div key={insight.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${cfg.bg} transition-colors hover:shadow-sm`}>
              <span className={`${cfg.color} mt-0.5 flex-shrink-0`}>{cfg.icon}</span>
              <span className="text-sm leading-relaxed">{insight.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}