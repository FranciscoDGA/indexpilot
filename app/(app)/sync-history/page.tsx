'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
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
import type { SyncJob, Site } from '@/types';
import { ConnectorManager } from '@/lib/connectors';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const triggerLabels: Record<string, string> = {
  manual: 'Manual',
  webhook: 'Webhook',
  polling: 'Polling',
  scheduled: 'Agendado',
  deploy: 'Deploy',
  git: 'Git Push',
};

export default function SyncHistoryPage() {
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: sitesData } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', session.user.id);

      setSites(sitesData || []);

      const manager = new ConnectorManager(supabase);
      const allJobs: SyncJob[] = [];

      for (const site of sitesData || []) {
        const siteJobs = await manager.listSyncJobsBySite(site.id, 50);
        allJobs.push(...siteJobs);
      }

      setSyncJobs(allJobs.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error fetching sync jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = selectedSite === 'all'
    ? syncJobs
    : syncJobs.filter((j) => j.site_id === selectedSite);

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de Sync"
        description="Visualize todas as sincronizações realizadas pelos conectores"
      />

      <div className="flex gap-4 items-center">
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Todos os Sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {filteredJobs.length} sincronizações
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Nenhuma sincronização registrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Criados</TableHead>
                <TableHead>Atualizados</TableHead>
                <TableHead>Removidos</TableHead>
                <TableHead>Falhas</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Badge className={statusColors[job.status] || ''}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {triggerLabels[job.trigger_type] || job.trigger_type}
                  </TableCell>
                  <TableCell>{job.items_processed}</TableCell>
                  <TableCell className="text-green-600">{job.items_created}</TableCell>
                  <TableCell className="text-blue-600">{job.items_updated}</TableCell>
                  <TableCell className="text-orange-600">{job.items_removed}</TableCell>
                  <TableCell className="text-red-600">{job.items_failed}</TableCell>
                  <TableCell className="text-sm">{formatDuration(job.duration_ms)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
