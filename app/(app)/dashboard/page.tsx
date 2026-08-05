'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardTitle } from '@/components/common/Card';
import { Globe, FileText, Clock, AlertCircle, Loader2 } from 'lucide-react';
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

        const { data: sitesData } = await supabase
          .from('sites')
          .select('id')
          .eq('user_id', session.user.id);

        const totalSites = sitesData?.length || 0;

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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const urlsToday =
          pubData?.filter((p: { created_at: string }) => new Date(p.created_at) >= today).length || 0;

        const urlsPending =
          pubData?.filter((p: { status: string }) => p.status === 'RECEIVED' || p.status === 'PROCESSING')
            .length || 0;

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
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: 'Sites', value: metrics.totalSites, icon: Globe, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'URLs Recebidas', value: metrics.totalUrls, icon: FileText, color: 'text-foreground' },
    { label: 'Hoje', value: metrics.urlsToday, icon: Clock, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Pendentes', value: metrics.urlsPending, icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua plataforma"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-6 py-3 border-b border-border">
          <CardTitle>Atividade Recente</CardTitle>
        </div>
        <CardContent>
          {metrics.lastPublication ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{metrics.lastPublication.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {metrics.lastPublication.url}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {new Date(metrics.lastPublication.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma atividade encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
