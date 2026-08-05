'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/common/Card';
import { MetricCard } from '@/components/common/MetricCard';
import { SectionHeader } from '@/components/common/InsightCard';
import { Skeleton } from '@/components/common/Skeleton';
import {
  Radar, Search, Link2, Layers, Clock, AlertTriangle,
  Globe, Zap, TrendingUp, Shield, Target, BarChart3,
  ChevronRight, ArrowRight, FileText, Eye,
} from 'lucide-react';

interface OGEStats {
  ctr_gaps: number;
  orphan_pages: number;
  cluster_gaps: number;
  freshness_opportunities: number;
  decay_alerts: number;
}

const pipelineStages = [
  { key: 'discover', label: 'Descoberta', icon: <Radar size={16} />, color: 'bg-blue-500', desc: 'Novas URLs' },
  { key: 'crawl', label: 'Crawler', icon: <Search size={16} />, color: 'bg-purple-500', desc: 'Rastreamento' },
  { key: 'seo', label: 'SEO', icon: <Shield size={16} />, color: 'bg-emerald-500', desc: 'Otimização' },
  { key: 'schema', label: 'Schema', icon: <FileText size={16} />, color: 'bg-amber-500', desc: 'Dados Estruturados' },
  { key: 'index', label: 'Google', icon: <Globe size={16} />, color: 'bg-cyan-500', desc: 'Indexação' },
  { key: 'monitor', label: 'Monitoramento', icon: <Eye size={16} />, color: 'bg-pink-500', desc: 'Rastreamento' },
  { key: 'report', label: 'Relatório', icon: <BarChart3 size={16} />, color: 'bg-indigo-500', desc: 'Análise' },
];

const modules = [
  {
    phase: 'Foundation',
    items: [
      { label: 'CTR Optimization', desc: 'Lacunas entre CTR esperado e atual', href: '/oge/ctr', color: 'border-blue-200 bg-blue-50/50', icon: <TrendingUp size={18} className="text-blue-600" />, stat: 'ctr_gaps' },
      { label: 'Internal Linking', desc: 'Páginas órfãs e links internos', href: '/oge/links', color: 'border-orange-200 bg-orange-50/50', icon: <Link2 size={18} className="text-orange-600" />, stat: 'orphan_pages' },
      { label: 'Topic Clusters', desc: 'Clusters semânticos incompletos', href: '/oge/clusters', color: 'border-purple-200 bg-purple-50/50', icon: <Layers size={18} className="text-purple-600" />, stat: 'cluster_gaps' },
      { label: 'Freshness Engine', desc: 'Conteúdo desatualizado detectado', href: '/oge/freshness', color: 'border-green-200 bg-green-50/50', icon: <Clock size={18} className="text-green-600" />, stat: 'freshness_opportunities' },
      { label: 'Content Decay', desc: 'Declínio gradual de desempenho', href: '/oge/decay', color: 'border-red-200 bg-red-50/50', icon: <AlertTriangle size={18} className="text-red-600" />, stat: 'decay_alerts' },
    ],
  },
  {
    phase: 'Intelligence',
    items: [
      { label: 'Google Discover', desc: 'Compatibilidade com Discover', href: '/oge/discover', color: 'border-indigo-200 bg-indigo-50/50', icon: <Zap size={18} className="text-indigo-600" />, stat: '' },
      { label: 'Cannibalization', desc: 'Canibalização de keywords', href: '/oge/cannibalization', color: 'border-pink-200 bg-pink-50/50', icon: <Target size={18} className="text-pink-600" />, stat: '' },
      { label: 'Crawl Budget', desc: 'Orçamento de rastreamento', href: '/oge/crawl-budget', color: 'border-cyan-200 bg-cyan-50/50', icon: <Radar size={18} className="text-cyan-600" />, stat: '' },
    ],
  },
  {
    phase: 'Market Intelligence',
    items: [
      { label: 'SERP Intelligence', desc: 'Featured snippets, FAQs, AI Overviews', href: '/oge/serp', color: 'border-teal-200 bg-teal-50/50', icon: <Search size={18} className="text-teal-600" />, stat: '' },
      { label: 'Competitor Watch', desc: 'Monitoramento de concorrentes', href: '/oge/competitors', color: 'border-slate-200 bg-slate-50/50', icon: <Eye size={18} className="text-slate-600" />, stat: '' },
      { label: 'Content Opportunities', desc: 'Gaps de conteúdo no mercado', href: '/oge/opportunities', color: 'border-amber-200 bg-amber-50/50', icon: <Target size={18} className="text-amber-600" />, stat: '' },
    ],
  },
  {
    phase: 'Advanced Growth',
    items: [
      { label: 'Domain Trust', desc: 'Evolução de confiança do domínio', href: '/oge/trust', color: 'border-violet-200 bg-violet-50/50', icon: <Shield size={18} className="text-violet-600" />, stat: '' },
      { label: 'Growth Simulator', desc: 'Previsão de impacto de mudanças', href: '/oge/simulator', color: 'border-rose-200 bg-rose-50/50', icon: <BarChart3 size={18} className="text-rose-600" />, stat: '' },
    ],
  },
];

export default function OGEDashboard() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [stats, setStats] = useState<OGEStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicationId) { setLoading(false); return; }
    const loadStats = async () => {
      try {
        const [ctrRes, linksRes, clusterRes, freshnessRes, decayRes] = await Promise.all([
          fetch(`/api/oge/ctr/analyze?publication_id=${publicationId}`),
          fetch(`/api/oge/links/orphans?publication_id=${publicationId}`),
          fetch(`/api/oge/clusters/gaps?publication_id=${publicationId}`),
          fetch(`/api/oge/freshness/opportunities?publication_id=${publicationId}`),
          fetch(`/api/oge/decay/alerts?publication_id=${publicationId}`),
        ]);
        const [ctr, links, cluster, freshness, decay] = await Promise.all([
          ctrRes.json(), linksRes.json(), clusterRes.json(), freshnessRes.json(), decayRes.json(),
        ]);
        setStats({ ctr_gaps: ctr.count || 0, orphan_pages: links.count || 0, cluster_gaps: cluster.count || 0, freshness_opportunities: freshness.count || 0, decay_alerts: decay.count || 0 });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadStats();
  }, [publicationId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalIssues = stats ? stats.ctr_gaps + stats.orphan_pages + stats.cluster_gaps + stats.freshness_opportunities + stats.decay_alerts : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organic Growth Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline completo de crescimento orgânico</p>
        </div>
        {publicationId && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{publicationId}</span>
        )}
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <div className="px-4 py-3 border-b border-border">
          <SectionHeader title="Pipeline de Crescimento" />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {pipelineStages.map((stage, i) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className={`w-10 h-10 rounded-xl ${stage.color} flex items-center justify-center text-white mb-2`}>
                    {stage.icon}
                  </div>
                  <span className="text-xs font-medium text-center">{stage.label}</span>
                  <span className="text-[10px] text-muted-foreground">{stage.desc}</span>
                </div>
                {i < pipelineStages.length - 1 && (
                  <ArrowRight size={16} className="text-muted-foreground/40 mx-1 flex-shrink-0 mt-[-20px]" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats && Object.entries(stats).map(([key, value]) => {
          const labels: Record<string, { label: string; color: string }> = {
            ctr_gaps: { label: 'CTR Gaps', color: 'info' },
            orphan_pages: { label: 'Páginas Órfãs', color: 'warning' },
            cluster_gaps: { label: 'Cluster Gaps', color: 'info' },
            freshness_opportunities: { label: 'Conteúdo Obsoleto', color: 'success' },
            decay_alerts: { label: 'Decay Alerts', color: 'error' },
          };
          const cfg = labels[key] || { label: key, color: 'info' };
          return (
            <MetricCard
              key={key}
              title={cfg.label}
              value={value}
              icon={<Target size={18} />}
              status={cfg.color as any}
            />
          );
        })}
        <MetricCard title="Total Issues" value={totalIssues} icon={<AlertTriangle size={18} />} status={totalIssues > 20 ? 'error' : totalIssues > 5 ? 'warning' : 'success'} />
      </div>

      {/* Module Phases */}
      {modules.map(phase => (
        <div key={phase.phase}>
          <h2 className="text-lg font-semibold mb-3">Fase: {phase.phase}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phase.items.map(item => (
              <Link key={item.href} href={publicationId ? `${item.href}?publication_id=${publicationId}` : item.href}>
                <Card className={`border ${item.color} hover:shadow-md transition-all cursor-pointer group h-full`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <h3 className="font-semibold text-sm">{item.label}</h3>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                    {item.stat && stats && (stats as any)[item.stat] > 0 && (
                      <span className="text-xs font-medium bg-white/80 px-2 py-0.5 rounded-full border">
                        {(stats as any)[item.stat]} issues
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}