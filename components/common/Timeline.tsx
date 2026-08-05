'use client';

import { CheckCircle2, AlertTriangle, Info, Clock, Loader2 } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  source?: string;
}

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' },
};

export function Timeline({ events, loading }: { events: TimelineEvent[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-muted mt-2 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-16 bg-muted rounded mb-1" />
              <div className="h-4 w-48 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-4">
        {events.map((event) => {
          const cfg = statusConfig[event.status];
          const Icon = cfg.icon;
          return (
            <div key={event.id} className="flex gap-3 group relative">
              <div className={`w-[11px] h-[11px] rounded-full ${cfg.dot} mt-1.5 flex-shrink-0 ring-2 ring-card z-10 group-hover:scale-125 transition-transform`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-mono">{event.time}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon size={12} />
                    {event.title}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
                )}
                {event.source && (
                  <span className="text-[10px] text-muted-foreground/60 mt-0.5 inline-block">{event.source}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}