'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Card, CardContent } from '@/components/common/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/common/Table';
import { PublicationStatusBadge } from '@/components/publications/StatusBadge';
import type { PublicationQueue, Site } from '@/types';

export default function PublicationsPage() {
  const [publications, setPublications] = useState<(PublicationQueue & { site: Site })[]>([]);
  const [filteredPublications, setFilteredPublications] = useState<(PublicationQueue & { site: Site })[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPublications();
  }, [publications, searchTerm, filterSite, filterStatus, filterPeriod]);

  const fetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Fetch sites
      const { data: sitesData } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', session.user.id);

      setSites(sitesData || []);

      // Fetch publications
      const { data: pubData } = await supabase
        .from('publication_queue')
        .select('*, sites(*)')
        .in('site_id', sitesData?.map((s) => s.id) || [])
        .order('created_at', { ascending: false });

      setPublications(pubData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPublications = () => {
    let filtered = publications;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.url.toLowerCase().includes(term) ||
          p.slug.toLowerCase().includes(term)
      );
    }

    // Filter by site
    if (filterSite) {
      filtered = filtered.filter((p) => p.site_id === filterSite);
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      const createdDate = new Date(filtered[0]?.created_at || '');

      switch (filterPeriod) {
        case 'today':
          filtered = filtered.filter((p) => {
            const date = new Date(p.created_at);
            return date.toDateString() === now.toDateString();
          });
          break;
        case '7days':
          filtered = filtered.filter((p) => {
            const date = new Date(p.created_at);
            return (now.getTime() - date.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          });
          break;
        case '30days':
          filtered = filtered.filter((p) => {
            const date = new Date(p.created_at);
            return (now.getTime() - date.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          });
          break;
      }
    }

    setFilteredPublications(filtered);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Publicações"
        description="Gerencie todas as publicações recebidas"
      />

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            type="text"
            placeholder="Buscar por título, URL ou slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Todos os Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="">Todos os Status</option>
              <option value="RECEIVED">Recebido</option>
              <option value="PROCESSING">Processando</option>
              <option value="INDEXED">Indexado</option>
              <option value="ERROR">Erro</option>
            </select>

            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : filteredPublications.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma publicação encontrada
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recebido em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPublications.map((pub) => (
                <TableRow key={pub.id}>
                  <TableCell className="font-medium">{pub.title}</TableCell>
                  <TableCell className="text-sm">{pub.site.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                    {pub.url}
                  </TableCell>
                  <TableCell>
                    <PublicationStatusBadge status={pub.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(pub.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Link href={`/publications/${pub.id}`}>
                      <span className="text-primary hover:underline text-sm font-medium">
                        Ver Detalhes
                      </span>
                    </Link>
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
