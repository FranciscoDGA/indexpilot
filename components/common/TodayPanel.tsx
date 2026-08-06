'use client';

import { CheckCircle2, TrendingUp, AlertTriangle, FileText, Zap } from 'lucide-react';

interface TodayItem {
  icon: React.ReactNode;
  text: string;
  color: string;
}

interface TodayPanelProps {
  items?: TodayItem[];
}

const defaultItems: TodayItem[] = [
  { icon: <CheckCircle2 size={14} />, text: '6 URLs indexadas', color: 'text-emerald-500' },
  { icon: <CheckCircle2 size={14} />, text: '2 auditorias executadas', color: 'text-emerald-500' },
  { icon: <CheckCircle2 size={14} />, text: '1 sitemap atualizado', color: 'text-emerald-500' },
  { icon: <CheckCircle2 size={14} />, text: '0 erros críticos', color: 'text-emerald-500' },
  { icon: <TrendingUp size={14} />, text: 'SEO Score +2%', color: 'text-blue-500' },
];

export function TodayPanel({ items = defaultItems }: TodayPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Hoje</h3>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 group">
            <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
            <span className="text-sm">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}