'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardTitle } from '@/components/common/Card';
import type { DashboardMetrics, PublicationQueue } from '@/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSites: 0,
    totalUrls: 0,
    totalIndexed: 0,
    totalErrors: 0,
    urlsToday: 0,
    urlsPending: 0,
    lastPublication: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        // Fetch total sites
        const { data: sitesData } = await supabase
          .from('sites')
          .select('id')
          .eq('user_id', session.user.id);

        const totalSites = sitesData?.length || 0;

        // Fetch publication metrics
        const { data: pubData } = await supabase
          .from('publication_queue')
          .select('id, status, created_at')
          .in(
            'site_id',
            sitesData?.map((s: { id: string }) => s.id) || []
          );

        const totalUrls = pubData?.length || 0;
        const totalIndexed = pubData?.filter((p: { status: string }) => p.status === 'INDEXED').length || 0;
        const totalErrors = pubData?.filter((p: { status: string }) => p.status === 'ERROR').length || 0;

        // Today's publications
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const urlsToday =
          pubData?.filter((p: { created_at: string }) => new Date(p.created_at) >= today).length || 0;

        // Pending publications
        const urlsPending =
          pubData?.filter((p: { status: string }) => p.status === 'RECEIVED' || p.status === 'PROCESSING')
            .length || 0;

        // Last publication
        const lastPublication = pubData?.sort(
          (a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] as PublicationQueue | undefined;

        setMetrics({
          totalSites,
          totalUrls,
          totalIndexed,
          totalErrors,
          urlsToday,
          urlsPending,
          lastPublication: lastPublication || null,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua plataforma IndexPilot"
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">
              {metrics.totalSites}
            </div>
            <div className="text-sm text-muted-foreground">Sites</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">{metrics.totalUrls}</div>
            <div className="text-sm text-muted-foreground">URLs Recebidas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {metrics.urlsToday}
            </div>
            <div className="text-sm text-muted-foreground">Hoje</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {metrics.urlsPending}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6 border-b border-border">
          <CardTitle>Atividade Recente</CardTitle>
        </div>
        <CardContent>
          {metrics.lastPublication ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{metrics.lastPublication.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.lastPublication.url}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(metrics.lastPublication.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma atividade encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
