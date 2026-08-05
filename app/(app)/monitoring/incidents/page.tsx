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
};

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  investigating: 'Investigando',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export default function MonitoringIncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams({
        site_id: 'site-1',
        limit: '50',
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);

      const response = await fetch(`/api/monitoring/incidents?${params}`);
      const data = await response.json();

      setIncidents(data.data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveIncident = async (id: string) => {
    try {
      await fetch(`/api/monitoring/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        }),
      });
      fetchIncidents();
    } catch (error) {
      console.error('Error resolving incident:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidentes"
        description="Gerencie incidentes de monitoramento dos seus sites"
      />

      <div className="flex gap-4 items-center flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todos os Status</option>
          <option value="open">Abertos</option>
          <option value="investigating">Investigando</option>
          <option value="resolved">Resolvidos</option>
          <option value="closed">Fechados</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todas as Severidades</option>
          <option value="critical">Crítico</option>
          <option value="high">Alto</option>
          <option value="medium">Médio</option>
          <option value="low">Baixo</option>
        </select>

        <span className="text-sm text-gray-500">
          {incidents.length} incidentes encontrados
        </span>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : incidents.length === 0 ? (
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Nenhum incidente encontrado</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Aberto em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div className="font-medium">{incident.title}</div>
                    {incident.description && (
                      <div className="text-xs text-gray-500 truncate max-w-[300px]">
                        {incident.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={severityColors[incident.severity] || ''}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[incident.status] || ''}>
                      {statusLabels[incident.status] || incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{incident.source}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(incident.opened_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {(incident.status === 'open' || incident.status === 'investigating') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveIncident(incident.id)}
                      >
                        Resolver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}