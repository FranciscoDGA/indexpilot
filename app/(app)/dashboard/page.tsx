'use client';

import { useEffect, useState, useMemo } from 'react';
import { MetricCard } from '@/components/common/MetricCard';
import { Timeline, type TimelineEvent } from '@/components/common/Timeline';
import { QuickActions } from '@/components/common/QuickActions';
import { InsightCard, SectionHeader } from '@/components/common/InsightCard';
import { SystemStatus } from '@/components/common/SystemStatus';
import { HealthGauge } from '@/components/common/HealthGauge';
import { WeeklyMission } from '@/components/common/WeeklyMission';
import { TodayPanel } from '@/components/common/TodayPanel';
import { InsightsPanel } from '@/components/common/InsightsPanel';
import { RecommendationPanel } from '@/components/common/RecommendationPanel';
import { Card, CardContent } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import {
  Globe, FileText, Clock, AlertCircle, TrendingUp, Zap, Search,
  CheckCircle2, ArrowUpRight, Target, Brain, Shield, BarChart3,
  Send, RefreshCw, Radar, FileSearch, Plus, Cpu, AlertTriangle,
  CalendarCheck, ArrowDownRight,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        const { data: sites } = await supabase.from('sites').select('id, name, url').eq('user_id', session.user.id);
        const siteIds = sites?.map((s: any) => s.id) || [];

        const { data: pubs } = await supabase
          .from('publication_queue')
          .select('id, status, created_at, title, url, site_id')
          .in('site_id', siteIds.length ? siteIds : ['__none__'])
          .order('created_at', { ascending: false });

        const { data: incidents } = await supabase
          .from('monitoring_events')
          .select('id, severity, title, created_at, event_type')
          .in('site_id', siteIds.length ? siteIds : ['__none__'])
          .order('created_at', { ascending: false })
          .limit(20);

        const now = new Date();
        const today = new Date(now); today.setHours(0,0,0,0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        const prevWeek = new Date(weekAgo); prevWeek.setDate(prevWeek.getDate() - 7);

        const totalUrls = pubs?.length || 0;
        const indexed = pubs?.filter((p: any) => p.status === 'INDEXED').length || 0;
        const errors = pubs?.filter((p: any) => p.status === 'ERROR').length || 0;
        const urlsToday = pubs?.filter((p: any) => new Date(p.created_at) >= today).length || 0;
        const urlsYesterday = pubs?.filter((p: any) => new Date(p.created_at) >= yesterday && new Date(p.created_at) < today).length || 0;
        const urlsThisWeek = pubs?.filter((p: any) => new Date(p.created_at) >= weekAgo).length || 0;
        const urlsPrevWeek = pubs?.filter((p: any) => new Date(p.created_at) >= prevWeek && new Date(p.created_at) < weekAgo).length || 0;
        const criticalIncidents = incidents?.filter((i: any) => i.severity === 'critical').length || 0;
        const warningIncidents = incidents?.filter((i: any) => i.severity === 'warning').length || 0;
        const indexRate = totalUrls > 0 ? Math.round((indexed / totalUrls) * 100) : 0;

        const chartData = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today); d.setDate(d.getDate() - (6 - i));
          const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
          const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
          const count = pubs?.filter((p: any) => { const pd = new Date(p.created_at); return pd >= dayStart && pd <= dayEnd; }).length || 0;
          return { day: d.toLocaleDateString('pt-BR', { weekday: 'short' }), urls: count };
        });

        const timeline: TimelineEvent[] = [];
        pubs?.slice(0, 6).forEach((p: any) => {
          const cat = p.status === 'INDEXED' ? 'indexation' as const : p.status === 'ERROR' ? 'error' as const : 'crawl' as const;
          timeline.push({
            id: p.id,
            time: new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(p.created_at),
            title: p.status === 'INDEXED' ? 'URL indexada' : p.status === 'ERROR' ? 'Erro na URL' : 'URL processada',
            description: p.title || p.url,
            status: p.status === 'INDEXED' ? 'success' : p.status === 'ERROR' ? 'error' : 'info',
            category: cat,
          });
        });
        incidents?.slice(0, 3).forEach((inc: any) => {
          timeline.push({
            id: inc.id,
            time: new Date(inc.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(inc.created_at),
            title: inc.title || inc.event_type || 'Evento detectado',
            description: inc.severity === 'critical' ? 'Requer atenção imediata' : undefined,
            status: inc.severity === 'critical' ? 'error' : inc.severity === 'warning' ? 'warning' : 'info',
            category: 'error',
          });
        });
        timeline.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));

        setData({
          sites: sites || [],
          totalUrls, indexed, errors, urlsToday, urlsYesterday,
          urlsThisWeek, urlsPrevWeek, indexRate, criticalIncidents, warningIncidents,
          chartData, timeline: timeline.slice(0, 10),
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const weekTrend = useMemo(() => {
    if (!data) return 0;
    return data.urlsPrevWeek > 0 ? Math.round(((data.urlsThisWeek - data.urlsPrevWeek) / data.urlsPrevWeek) * 100) : 0;
  }, [data]);

  const todayTrend = useMemo(() => {
    if (!data) return 0;
    return data.urlsYesterday > 0 ? Math.round(((data.urlsToday - data.urlsYesterday) / data.urlsYesterday) * 100) : 0;
  }, [data]);

  const quickActions = [
    { label: 'Nova Auditoria', icon: <FileSearch size={14} />, color: 'text-blue-500' },
    { label: 'Executar Crawl', icon: <Radar size={14} />, color: 'text-purple-500' },
    { label: 'Enviar para Google', icon: <Send size={14} />, color: 'text-emerald-500' },
    { label: 'Atualizar Sitemap', icon: <RefreshCw size={14} />, color: 'text-amber-500' },
    { label: 'Comparar Site', icon: <BarChart3 size={14} />, color: 'text-cyan-500' },
    { label: 'Adicionar Site', icon: <Plus size={14} />, color: 'text-primary' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, Francisco</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Última sincronização: há {Math.floor((Date.now() - (data?.timeline?.[0]?.timestamp?.getTime() || Date.now())) / 60000) || 3} minutos
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistema operacional
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Health Score Hero + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <HealthGauge score={94} size={140} strokeWidth={10} />
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">vs semana anterior</p>
              <div className="flex items-center justify-center gap-1 text-emerald-600 text-sm font-medium">
                <ArrowUpRight size={14} />
                <span>+3%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <MetricCard
            title="Indexação"
            value={`${data.indexRate}%`}
            subtitle={`${data.indexed} URLs indexadas`}
            icon={<CheckCircle2 size={18} />}
            status={data.indexRate >= 90 ? 'success' : data.indexRate >= 70 ? 'warning' : 'error'}
            trend={{ value: todayTrend, label: 'vs ontem', direction: todayTrend >= 0 ? 'up' : 'down' }}
            sparkline={[82, 85, 87, 89, 91, 93, data.indexRate]}
          />
          <MetricCard
            title="URLs Hoje"
            value={data.urlsToday}
            subtitle={`${data.urlsThisWeek} esta semana`}
            icon={<TrendingUp size={18} />}
            status="success"
            trend={{ value: todayTrend, label: 'vs ontem', direction: todayTrend >= 0 ? 'up' : 'down' }}
            sparkline={data.chartData?.map((d: any) => d.urls) || [5, 8, 12, 7, 15, 10, data.urlsToday]}
          />
          <MetricCard
            title="Problemas Críticos"
            value={data.criticalIncidents}
            subtitle={`${data.warningIncidents} avisos`}
            icon={<AlertTriangle size={18} />}
            status={data.criticalIncidents === 0 ? 'success' : data.criticalIncidents <= 2 ? 'warning' : 'error'}
            sparkline={[5, 3, 4, 2, 3, 1, data.criticalIncidents]}
          />
          <MetricCard
            title="Tempo Médio Indexação"
            value="4h 12m"
            subtitle="Média últimos 7 dias"
            icon={<Clock size={18} />}
            status="success"
            trend={{ value: -12, label: 'melhoria', direction: 'up' }}
            sparkline={[6.2, 5.8, 5.1, 4.8, 4.5, 4.3, 4.2]}
          />
        </div>
      </div>

      {/* Weekly Mission + Today + Insights + Incidents */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <WeeklyMission totalTarget={300} completed={data.indexed || 184} />
        <TodayPanel />
        <InsightsPanel />
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Incidentes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Críticos</span>
              <span className={`text-lg font-bold ${data.criticalIncidents > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{data.criticalIncidents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avisos</span>
              <span className={`text-lg font-bold ${data.warningIncidents > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{data.warningIncidents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Em investigação</span>
              <span className="text-lg font-bold text-muted-foreground">0</span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground">Última ocorrência: há 4 horas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts + Timeline + Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Indexação por Dia" />
          </div>
          <CardContent className="p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} labelStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="urls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Timeline" />
          </div>
          <CardContent className="p-4 max-h-60 overflow-y-auto">
            {data.timeline?.length > 0 ? (
              <Timeline events={data.timeline} />
            ) : (
              <div className="text-center py-6">
                <Clock size={20} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum evento recente</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-1">
          <SystemStatus />
        </div>
      </div>

      {/* AI Recommendations */}
      <Card>
        <div className="px-4 py-3 border-b border-border">
          <SectionHeader title="IA Recomenda" />
        </div>
        <CardContent className="p-4">
          <RecommendationPanel />
        </CardContent>
      </Card>

      {/* Priorities + Opportunities + Competitors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Prioridades" />
          </div>
          <CardContent className="p-4 space-y-3">
            {[
              { level: 'Alta', text: 'Robots bloqueando 12 URLs de produto', color: 'bg-red-500', textColor: 'text-red-600' },
              { level: 'Média', text: 'Schema incompleto em 8 páginas', color: 'bg-amber-500', textColor: 'text-amber-600' },
              { level: 'Baixa', text: 'Meta Description longa em 5 posts', color: 'bg-blue-500', textColor: 'text-blue-600' },
              { level: 'Baixa', text: 'Imagens sem alt text em artigos', color: 'bg-blue-500', textColor: 'text-blue-600' },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${p.color} mt-1.5 flex-shrink-0`} />
                <div>
                  <span className={`text-[10px] font-semibold uppercase ${p.textColor}`}>{p.level}</span>
                  <p className="text-sm">{p.text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Oportunidades" />
          </div>
          <CardContent className="p-4 space-y-2">
            {[
              { type: 'Criar Cluster', count: 12, icon: <Zap size={14} />, color: 'text-purple-500' },
              { type: 'Atualizar Conteúdo', count: 8, icon: <RefreshCw size={14} />, color: 'text-blue-500' },
              { type: 'Melhorar Links Internos', count: 11, icon: <Target size={14} />, color: 'text-emerald-500' },
              { type: 'Adicionar FAQ', count: 6, icon: <FileText size={14} />, color: 'text-amber-500' },
              { type: 'Adicionar Schema', count: 4, icon: <Shield size={14} />, color: 'text-cyan-500' },
            ].map((opp, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                <span className={opp.color}>{opp.icon}</span>
                <span className="text-sm flex-1">{opp.type}</span>
                <span className="text-sm font-mono font-medium">{opp.count}</span>
                <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Concorrentes Monitorados" />
          </div>
          <CardContent className="p-4 space-y-3">
            {[
              { name: 'TechRadar', activity: '+14 páginas', time: 'há 2 dias', color: 'text-emerald-500' },
              { name: 'Moz', activity: 'novo cluster', time: 'há 5 dias', color: 'text-blue-500' },
              { name: 'Semrush', activity: '2 categorias novas', time: 'há 1 semana', color: 'text-purple-500' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${c.color}`}>{c.activity}</span>
                    <span className="text-[10px] text-muted-foreground">· {c.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}