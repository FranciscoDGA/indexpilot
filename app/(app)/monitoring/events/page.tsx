'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-800',
};

const eventTypeLabels: Record<string, string> = {
  'content.changed': 'Conteúdo Alterado',
  'content.added': 'Conteúdo Adicionado',
  'content.removed': 'Conteúdo Removido',
  'technical.robots_changed': 'Robots.txt Alterado',
  'technical.sitemap_changed': 'Sitemap Alterado',
  'technical.canonical_changed': 'Canonical Alterado',
  'technical.schema_changed': 'Schema Alterado',
  'technical.title_changed': 'Título Alterado',
  'technical.meta_changed': 'Meta Alterada',
  'technical.headings_changed': 'Headings Alterados',
  'technical.links_changed': 'Links Alterados',
  'technical.status_changed': 'Status Alterado',
  'availability.site_down': 'Site Offline',
  'availability.slow_response': 'Resposta Lenta',
  'availability.ssl_error': 'Erro SSL',
  'availability.error_burst': 'Rajada de Erros',
  'availability.redirect_unexpected': 'Redirect Inesperado',
  'indexation.drift_detected': 'Drift Detectado',
  'indexation.coverage_drop': 'Queda na Cobertura',
  'indexation.new_untracked': 'Nova URL Não Rastreada',
};

export default function MonitoringEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [page, eventTypeFilter, severityFilter]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams({
        site_id: 'site-1',
        limit: '20',
        offset: String(page * 20),
      });

      if (eventTypeFilter !== 'all') params.set('event_type', eventTypeFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);

      const response = await fetch(`/api/monitoring/events?${params}`);
      const data = await response.json();

      setEvents(data.data || []);
      setHasMore(data.data?.length === 20);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eventos de Monitoramento"
        description="Visualize todos os eventos detectados nos seus sites"
      />

      <div className="flex gap-4 items-center flex-wrap">
        <select
          value={eventTypeFilter}
          onChange={(e) => { setEventTypeFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todos os Tipos</option>
          <option value="content.changed">Conteúdo Alterado</option>
          <option value="technical.robots_changed">Robots.txt</option>
          <option value="technical.sitemap_changed">Sitemap</option>
          <option value="technical.canonical_changed">Canonical</option>
          <option value="availability.site_down">Site Offline</option>
          <option value="availability.slow_response">Resposta Lenta</option>
          <option value="indexation.coverage_drop">Queda Cobertura</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todas as Severidades</option>
          <option value="critical">Crítico</option>
          <option value="high">Alto</option>
          <option value="medium">Médio</option>
          <option value="low">Baixo</option>
          <option value="info">Info</option>
        </select>

        <span className="text-sm text-gray-500">
          {events.length} eventos encontrados
        </span>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : events.length === 0 ? (
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Nenhum evento encontrado</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-medium">
                      {eventTypeLabels[event.event_type] || event.event_type}
                    </div>
                    {event.payload?.url && (
                      <div className="text-xs text-gray-500 truncate max-w-[300px]">
                        {event.payload.url}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={severityColors[event.severity] || ''}>
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{event.source}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(event.detected_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {event.acknowledged_at ? (
                      <Badge className="bg-green-100 text-green-800">Reconhecido</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          Anterior
        </Button>
        <span className="text-sm text-gray-500">Página {page + 1}</span>
        <Button
          variant="outline"
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}