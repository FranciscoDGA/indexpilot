'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';

interface InsightCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  color?: string;
  sparkline?: number[];
  loading?: boolean;
}

export function InsightCard({ title, value, change, changeLabel, icon, color = '#3b82f6', sparkline, loading }: InsightCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  const max = sparkline ? Math.max(...sparkline) : 100;
  const min = sparkline ? Math.min(...sparkline) : 0;
  const range = max - min || 1;

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
              {change > 0 ? <ArrowUpRight size={12} /> : change < 0 ? <ArrowDownRight size={12} /> : <Minus size={12} />}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <svg width="60" height="24" className="flex-shrink-0">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              points={sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 60},${24 - ((v - min) / range) * 24}`).join(' ')}
            />
          </svg>
        )}
      </div>
    </div>
  );
}

interface RankedItemProps {
  rank: number;
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
}

export function RankedItem({ rank, label, value, badge, badgeColor = 'bg-primary/10 text-primary' }: RankedItemProps) {
  return (
    <div className="flex items-center gap-3 py-2 group hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors">
      <span className="text-xs font-bold text-muted-foreground w-5 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground font-mono">{value}</span>
      {badge && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeColor}`}>{badge}</span>
      )}
    </div>
  );
}

export function SectionHeader({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {action && (
        <button onClick={action} className="text-xs text-primary hover:underline">{actionLabel || 'Ver tudo'}</button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon && <div className="text-muted-foreground mb-3">{icon}</div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
    </div>
  );
}