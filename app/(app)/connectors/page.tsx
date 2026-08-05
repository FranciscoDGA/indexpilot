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
import type { Connector, Site } from '@/types';
import { ConnectorManager } from '@/lib/connectors';
import { PROVIDER_REGISTRY } from '@/lib/connectors';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  syncing: 'bg-blue-100 text-blue-800',
};

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);

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
      const allConnectors: Connector[] = [];

      for (const site of sitesData || []) {
        const siteConnectors = await manager.listConnectors(site.id);
        allConnectors.push(...siteConnectors);
      }

      setConnectors(allConnectors);
    } catch (error) {
      console.error('Error fetching connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnectors = selectedSite === 'all'
    ? connectors
    : connectors.filter((c) => c.site_id === selectedSite);

  const getProviderName = (provider: string) => {
    const info = PROVIDER_REGISTRY[provider];
    return info?.name || provider;
  };

  const getProviderIcon = (provider: string) => {
    const info = PROVIDER_REGISTRY[provider];
    return info?.icon || '🔗';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conectores CMS"
        description="Gerencie integrações com plataformas de CMS e frameworks"
      >
        <Button onClick={() => setShowForm(true)}>
          + Novo Conector
        </Button>
      </PageHeader>

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
          {filteredConnectors.length} conectores
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filteredConnectors.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">Nenhum conector configurado</p>
            <Button onClick={() => setShowForm(true)}>
              Adicionar Primeiro Conector
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conector</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Syncs</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Último Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConnectors.map((connector) => (
                <TableRow key={connector.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getProviderIcon(connector.provider)}</span>
                      {connector.name}
                    </div>
                  </TableCell>
                  <TableCell>{getProviderName(connector.provider)}</TableCell>
                  <TableCell>
                    {sites.find((s) => s.id === connector.site_id)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[connector.status] || ''}>
                      {connector.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{connector.sync_count}</TableCell>
                  <TableCell>{connector.event_count}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {connector.last_sync_at
                      ? new Date(connector.last_sync_at).toLocaleDateString('pt-BR')
                      : '-'}
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
