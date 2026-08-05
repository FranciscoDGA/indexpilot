'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';

interface SparklineData {
  value: number;
  label?: string;
}

type SparklineInput = SparklineData | number;

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label?: string; direction: 'up' | 'down' | 'flat' };
  sparkline?: SparklineInput[];
  status?: 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  className?: string;
}

function MiniSparkline({ data, color }: { data: SparklineInput[]; color: string }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => typeof d === 'number' ? d : d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={(values.length - 1) / (values.length - 1) * w}
        cy={h - ((values[values.length - 1] - min) / range) * h}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

const statusColors = {
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

const sparklineColors = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export function MetricCard({
  title, value, subtitle, icon, trend, sparkline, status = 'info', loading, className = '',
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 group ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'success' ? 'bg-emerald-500/10' : status === 'warning' ? 'bg-amber-500/10' : status === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
          <span className={statusColors[status]}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
              {trend.direction === 'up' && <ArrowUpRight size={12} />}
              {trend.direction === 'down' && <ArrowDownRight size={12} />}
              {trend.direction === 'flat' && <Minus size={12} />}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
            </div>
          )}
        </div>
        {sparkline && <MiniSparkline data={sparkline} color={sparklineColors[status]} />}
      </div>
    </div>
  );
}