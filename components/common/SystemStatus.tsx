'use client';

import { useEffect, useState } from 'react';
import { Globe, Radar, Clock, CalendarClock, Brain, Webhook, CheckCircle2 } from 'lucide-react';

interface StatusItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'online' | 'running' | 'active' | 'processing' | 'offline';
  detail?: string;
}

const defaultStatuses: StatusItem[] = [
  { id: 'gsc', label: 'Google Search Console', icon: <Globe size={14} />, status: 'online', detail: 'Conectado' },
  { id: 'crawler', label: 'Crawler', icon: <Radar size={14} />, status: 'running', detail: 'Executando' },
  { id: 'queue', label: 'Queue', icon: <Clock size={14} />, status: 'active', detail: '14 URLs' },
  { id: 'scheduler', label: 'Scheduler', icon: <CalendarClock size={14} />, status: 'active', detail: 'Ativo' },
  { id: 'ai', label: 'AI Engine', icon: <Brain size={14} />, status: 'processing', detail: 'Online' },
  { id: 'webhook', label: 'Webhook', icon: <Webhook size={14} />, status: 'online', detail: 'Recebendo eventos' },
];

const statusColors = {
  online: 'bg-emerald-500',
  running: 'bg-blue-500',
  active: 'bg-amber-500',
  processing: 'bg-purple-500',
  offline: 'bg-red-500',
};

const statusLabels = {
  online: 'Online',
  running: 'Executando',
  active: 'Ativo',
  processing: 'Processando',
  offline: 'Offline',
};

export function SystemStatus() {
  const [statuses, setStatuses] = useState<StatusItem[]>(defaultStatuses);

  useEffect(() => {
    const iv = setInterval(() => {
      setStatuses(prev => prev.map(s => ({
        ...s,
        detail: s.id === 'queue'
          ? `${10 + Math.floor(Math.random() * 10)} URLs`
          : s.detail,
      })));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status da Plataforma</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Todos operacionais</span>
        </div>
      </div>
      <div className="space-y-2">
        {statuses.map(s => (
          <div key={s.id} className="flex items-center gap-2.5 py-1 group">
            <div className={`w-2 h-2 rounded-full ${statusColors[s.status]} flex-shrink-0 group-hover:scale-125 transition-transform`} />
            <span className="text-muted-foreground">{s.icon}</span>
            <span className="text-xs font-medium flex-1">{s.label}</span>
            <span className="text-[10px] text-muted-foreground">{s.detail || statusLabels[s.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}