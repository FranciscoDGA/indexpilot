'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface MonitoringStats {
  totalEvents: number;
  criticalEvents: number;
  openIncidents: number;
  resolvedIncidents: number;
  totalSnapshots: number;
  avgResponseTime: number;
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-800',
};

export default function MonitoringPage() {
  const [stats, setStats] = useState<MonitoringStats>({
    totalEvents: 0,
    criticalEvents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    totalSnapshots: 0,
    avgResponseTime: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const [eventsRes, incidentsRes, snapshotsRes] = await Promise.all([
        fetch('/api/monitoring/events?site_id=site-1&limit=10'),
        fetch('/api/monitoring/incidents?site_id=site-1&limit=50'),
        fetch('/api/monitoring/snapshots?site_id=site-1&limit=10'),
      ]);

      const eventsData = await eventsRes.json();
      const incidentsData = await incidentsRes.json();
      const snapshotsData = await snapshotsRes.json();

      const events = eventsData.data || [];
      const incidents = incidentsData.data || [];
      const snapshots = snapshotsData.data || [];

      setStats({
        totalEvents: events.length,
        criticalEvents: events.filter((e: any) => e.severity === 'critical').length,
        openIncidents: incidents.filter((i: any) => i.status === 'open').length,
        resolvedIncidents: incidents.filter((i: any) => i.status === 'resolved').length,
        totalSnapshots: snapshots.length,
        avgResponseTime: snapshots.reduce((acc: number, s: any) => acc + (s.response_time_ms || 0), 0) / Math.max(snapshots.length, 1),
      });

      setRecentEvents(events.slice(0, 10));
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoramento em Tempo Real"
        description="Acompanhe eventos, incidentes e mudanças nos seus sites"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Eventos Totais</div>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Eventos Críticos</div>
            <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Incidentes Abertos</div>
            <div className="text-2xl font-bold text-orange-600">{stats.openIncidents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Tempo Médio Resposta</div>
            <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Eventos Recentes</h3>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Carregando...</div>
            ) : recentEvents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhum evento registrado</div>
            ) : (
              <div className="divide-y">
                {recentEvents.map((event) => (
                  <div key={event.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.event_type}</span>
                      <Badge className={severityColors[event.severity] || ''}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(event.detected_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Links Rápidos</h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              <a
                href="/monitoring/events"
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Todos os Eventos</div>
                <div className="text-sm text-gray-500">Visualize e filtre todos os eventos de monitoramento</div>
              </a>
              <a
                href="/monitoring/incidents"
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Incidentes</div>
                <div className="text-sm text-gray-500">Gerencie incidentes abertos e resolvidos</div>
              </a>
              <a
                href="/monitoring/rules"
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Regras de Monitoramento</div>
                <div className="text-sm text-gray-500">Configure regras de alerta automáticas</div>
              </a>
              <a
                href="/alert-preferences"
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Preferências de Notificação</div>
                <div className="text-sm text-gray-500">Configure canais de notificação</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}