'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { PublicationStatusBadge } from '@/components/publications/StatusBadge';
import type { Site, PublicationQueue, SiteDashboardMetrics } from '@/types';

export default function SiteDashboardPage({ params }: { params: { id: string } }) {
  const [site, setSite] = useState<Site | null>(null);
  const [metrics, setMetrics] = useState<SiteDashboardMetrics>({
    totalPublications: 0,
    publicationsToday: 0,
    pendingPublications: 0,
    processedPublications: 0,
    successRate: 0,
    lastPublicationAt: null,
  });
  const [recentPublications, setRecentPublications] = useState<PublicationQueue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      // Fetch site
      const { data: siteData } = await supabase
        .from('sites')
        .select('*')
        .eq('id', params.id)
        .single();

      setSite(siteData);

      // Fetch publications
      const { data: pubData } = await supabase
        .from('publication_queue')
        .select('*')
        .eq('site_id', params.id)
        .order('created_at', { ascending: false });

      const publications = pubData || [];

      // Calculate metrics
      const total = publications.length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = publications.filter(
        (p) => new Date(p.created_at) >= today
      ).length;
      const pending = publications.filter(
        (p) => p.status === 'RECEIVED' || p.status === 'PROCESSING'
      ).length;
      const processed = publications.filter(
        (p) => p.status === 'INDEXED' || p.status === 'ERROR'
      ).length;
      const indexed = publications.filter((p) => p.status === 'INDEXED').length;
      const successRate = total > 0 ? (indexed / total) * 100 : 0;
      const lastPub = publications[0];

      setMetrics({
        totalPublications: total,
        publicationsToday: todayCount,
        pendingPublications: pending,
        processedPublications: processed,
        successRate: Math.round(successRate),
        lastPublicationAt: lastPub?.created_at || null,
      });

      // Get recent publications
      setRecentPublications(publications.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!site) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Site não encontrado</p>
        <Link href="/sites">
          <Button>Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/sites">
          <Button variant="ghost" size="sm">
            ← Voltar
          </Button>
        </Link>
      </div>

      <PageHeader
        title={site.name}
        description={site.domain}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">
              {metrics.totalPublications}
            </div>
            <div className="text-sm text-muted-foreground">Publicações</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics.publicationsToday}
            </div>
            <div className="text-sm text-muted-foreground">Hoje</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {metrics.pendingPublications}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {metrics.processedPublications}
            </div>
            <div className="text-sm text-muted-foreground">Processadas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {metrics.successRate}%
            </div>
            <div className="text-sm text-muted-foreground">Taxa Sucesso</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Publications */}
      <Card>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Publicações Recentes</h2>
        </div>
        {recentPublications.length === 0 ? (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma publicação neste site
            </div>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recebido em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPublications.map((pub) => (
                <TableRow key={pub.id}>
                  <TableCell className="font-medium">{pub.title}</TableCell>
                  <TableCell>
                    <PublicationStatusBadge status={pub.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(pub.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Link href={`/publications/${pub.id}`}>
                      <span className="text-primary hover:underline text-sm">
                        Ver
                      </span>
                    </Link>
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
