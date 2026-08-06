'use client';

import { Target } from 'lucide-react';

interface WeeklyMissionProps {
  totalTarget?: number;
  completed?: number;
  label?: string;
}

export function WeeklyMission({ totalTarget = 300, completed = 184, label = 'URLs indexadas' }: WeeklyMissionProps) {
  const pct = totalTarget > 0 ? Math.min(100, Math.round((completed / totalTarget) * 100)) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missão da Semana</h3>
          <p className="text-[10px] text-muted-foreground">Progresso automático</p>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{completed}</span>
          <span className="text-sm text-muted-foreground">/ {totalTarget} {label}</span>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-1.5">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{pct}% concluído</span>
        <span>{totalTarget - completed} restantes</span>
      </div>
    </div>
  );
}