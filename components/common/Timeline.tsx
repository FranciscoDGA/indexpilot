'use client';

import { CheckCircle2, AlertTriangle, Info, Clock, Globe, Radar, FileText, Brain, RefreshCw } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  time: string;
  timestamp?: Date;
  title: string;
  description?: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  category?: 'indexation' | 'crawl' | 'sitemap' | 'schema' | 'competitor' | 'deploy' | 'ai' | 'error';
  source?: string;
}

const categoryConfig = {
  indexation: { icon: <Globe size={12} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Indexação' },
  crawl: { icon: <Radar size={12} />, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Crawl' },
  sitemap: { icon: <FileText size={12} />, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Sitemap' },
  schema: { icon: <FileText size={12} />, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Schema' },
  competitor: { icon: <Globe size={12} />, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Concorrente' },
  deploy: { icon: <RefreshCw size={12} />, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Deploy' },
  ai: { icon: <Brain size={12} />, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'IA' },
  error: { icon: <AlertTriangle size={12} />, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Erro' },
};

const statusConfig = {
  success: { dot: 'bg-emerald-500', icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
  warning: { dot: 'bg-amber-500', icon: <AlertTriangle size={14} className="text-amber-500" /> },
  error: { dot: 'bg-red-500', icon: <AlertTriangle size={14} className="text-red-500" /> },
  info: { dot: 'bg-blue-500', icon: <Info size={14} className="text-blue-500" /> },
  pending: { dot: 'bg-muted-foreground', icon: <Clock size={14} className="text-muted-foreground" /> },
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

export function Timeline({ events, loading }: { events: TimelineEvent[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
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
      <div className="space-y-3">
        {events.map((event) => {
          const sCfg = statusConfig[event.status];
          const cCfg = event.category ? categoryConfig[event.category] : null;
          const relTime = event.timestamp ? relativeTime(event.timestamp) : event.time;
          return (
            <div key={event.id} className="flex gap-3 group relative">
              <div className={`w-[11px] h-[11px] rounded-full ${sCfg.dot} mt-1.5 flex-shrink-0 ring-2 ring-card z-10 group-hover:scale-125 transition-transform`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono">{relTime}</span>
                  {cCfg && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${cCfg.bg} ${cCfg.color}`}>
                      {cCfg.icon}
                      {cCfg.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {sCfg.icon}
                  <span className="text-sm font-medium">{event.title}</span>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}