'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { MetricCard } from '@/components/common/MetricCard';
import { InsightCard, SectionHeader, RankedItem } from '@/components/common/InsightCard';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/common/Badge';
import { InsightCard as IntelInsightCard } from '@/components/intelligence/InsightCard';
import { RecommendationList } from '@/components/intelligence/RecommendationList';
import { HealthScoreGauge } from '@/components/intelligence/HealthScoreGauge';
import { ReportExporter } from '@/components/intelligence/ReportExporter';
import { Insight, Recommendation, SeoHealthScore } from '@/types/intelligence';
import Link from 'next/link';
import {
  Brain, TrendingUp, AlertTriangle, Target, Search, Globe,
  FileText, ArrowUpRight, ArrowDownRight, BarChart3, Eye,
  Zap, Shield, Clock, Star,
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

export default function IntelligencePage() {
  const [siteId] = useState('site-1');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [healthScore, setHealthScore] = useState<SeoHealthScore>({
    overall_health: 0, growth_potential: 0, index_velocity: 0, content_freshness: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const generateRes = await fetch('/api/intelligence/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publication_id: siteId }),
        });
        if (generateRes.ok) {
          const d = await generateRes.json();
          setInsights(d.insights || []);
          setRecommendations(d.recommendations || []);
          setHealthScore(d.health_scores);
        }
        const insightsRes = await fetch(`/api/intelligence/insights?publication_id=${siteId}`);
        if (insightsRes.ok) { const d = await insightsRes.json(); setInsights(d.data || []); }
        const recsRes = await fetch(`/api/intelligence/recommendations?publication_id=${siteId}`);
        if (recsRes.ok) { const d = await recsRes.json(); setRecommendations(d.data || []); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [siteId]);

  const filteredInsights = selectedPriority ? insights.filter(i => i.priority === selectedPriority) : insights;
  const criticalCount = insights.filter(i => i.priority === 'CRITICAL').length;
  const highCount = insights.filter(i => i.priority === 'HIGH').length;

  const trendChart = Array.from({ length: 7 }, (_, i) => ({
    day: ['Seg','Ter','Qua','Qui','Sex','Sab','Dom'][i],
    score: 78 + Math.floor(Math.random() * 14),
    indexed: 12 + Math.floor(Math.random() * 15),
  }));

  const topKeywords = [
    { rank: 1, label: 'seo indexação', value: '#3', badge: '↑2' },
    { rank: 2, label: 'google search console', value: '#5', badge: '↑1' },
    { rank: 3, label: 'crawl errors', value: '#8', badge: '↓2' },
    { rank: 4, label: 'structured data', value: '#11', badge: '↑5' },
    { rank: 5, label: 'core web vitals', value: '#14', badge: '↑3' },
  ];

  const topUrls = [
    { rank: 1, label: '/blog/seo-guide-2024', value: '12.4K', badge: '↑18%' },
    { rank: 2, label: '/tools/index-checker', value: '8.7K', badge: '↑12%' },
    { rank: 3, label: '/blog/structured-data', value: '6.2K', badge: '↑8%' },
    { rank: 4, label: '/pricing', value: '5.8K', badge: '↓3%' },
    { rank: 5, label: '/blog/core-web-vitals', value: '4.1K', badge: '↑22%' },
  ];

  const topGains = [
    { rank: 1, label: '/blog/seo-guide-2024', value: '+18%', badge: 'Top 3' },
    { rank: 2, label: '/blog/core-web-vitals', value: '+22%', badge: 'Top 10' },
    { rank: 3, label: '/tools/robots-txt', value: '+15%', badge: 'Top 5' },
  ];

  const topLosses = [
    { rank: 1, label: '/blog/old-post', value: '-25%', badge: 'Lost' },
    { rank: 2, label: '/category/legacy', value: '-18%', badge: 'Dropped' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-48" /></div>
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Inteligência</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise completa de SEO e recomendações de IA</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportExporter publicationId={siteId} period="daily" />
          <Link href="/reports" className="text-xs text-primary hover:underline">Ver relatórios →</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Health Score" value={`${healthScore.overall_health}/100`} icon={<Shield size={18} />} status="success" sparkline={[72, 78, 82, 85, 88, 91, healthScore.overall_health]} />
        <MetricCard title="Insights" value={insights.length} subtitle={`${criticalCount} críticas`} icon={<Brain size={18} />} status={criticalCount > 0 ? 'warning' : 'success'} />
        <MetricCard title="Oportunidades" value={recommendations.length} icon={<Target size={18} />} status="info" trend={{ value: 12, label: 'esta semana', direction: 'up' }} />
        <MetricCard title="Growth Potential" value={`${healthScore.growth_potential}%`} icon={<TrendingUp size={18} />} status="success" sparkline={[60, 65, 70, 72, 75, 78, healthScore.growth_potential]} />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button onClick={() => setSelectedPriority(null)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!selectedPriority ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Todas ({insights.length})</button>
        {criticalCount > 0 && <button onClick={() => setSelectedPriority('CRITICAL')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedPriority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>Críticas ({criticalCount})</button>}
        {highCount > 0 && <button onClick={() => setSelectedPriority('HIGH')} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedPriority === 'HIGH' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800'}`}>Altas ({highCount})</button>}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Insights */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Insights Detectadas" />
          {filteredInsights.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma insight encontrada com este filtro.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredInsights.map(insight => <IntelInsightCard key={insight.id} insight={insight} />)}
            </div>
          )}

          {/* Trend Chart */}
          <Card>
            <div className="px-4 py-3 border-b border-border">
              <SectionHeader title="Tendência SEO Score & Indexação" />
            </div>
            <CardContent className="p-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="score" name="SEO Score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="indexed" name="URLs Indexadas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recommendations */}
          <div>
            <SectionHeader title="Recomendações Top" />
            {recommendations.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhuma recomendação disponível.</CardContent></Card>
            ) : (
              <RecommendationList recommendations={recommendations.slice(0, 5)} />
            )}
          </div>

          {/* Top Keywords */}
          <Card>
            <div className="px-4 py-3 border-b border-border">
              <SectionHeader title="Top Keywords" />
            </div>
            <CardContent className="p-3">
              {topKeywords.map(k => <RankedItem key={k.rank} {...k} badgeColor="bg-purple-100 text-purple-700" />)}
            </CardContent>
          </Card>

          {/* Top URLs */}
          <Card>
            <div className="px-4 py-3 border-b border-border">
              <SectionHeader title="Top URLs" />
            </div>
            <CardContent className="p-3">
              {topUrls.map(u => <RankedItem key={u.rank} {...u} badgeColor="bg-emerald-100 text-emerald-700" />)}
            </CardContent>
          </Card>

          {/* Top Gains */}
          <Card>
            <div className="px-4 py-3 border-b border-border">
              <SectionHeader title="Maiores Ganhos" />
            </div>
            <CardContent className="p-3">
              {topGains.map(g => (
                <div key={g.rank} className="flex items-center gap-2 py-1.5">
                  <ArrowUpRight size={12} className="text-emerald-500" />
                  <span className="text-sm flex-1 truncate">{g.label}</span>
                  <span className="text-xs font-medium text-emerald-600">{g.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Losses */}
          <Card>
            <div className="px-4 py-3 border-b border-border">
              <SectionHeader title="Maiores Perdas" />
            </div>
            <CardContent className="p-3">
              {topLosses.length > 0 ? topLosses.map(g => (
                <div key={g.rank} className="flex items-center gap-2 py-1.5">
                  <ArrowDownRight size={12} className="text-red-500" />
                  <span className="text-sm flex-1 truncate">{g.label}</span>
                  <span className="text-xs font-medium text-red-600">{g.value}</span>
                </div>
              )) : <p className="text-xs text-muted-foreground">Nenhuma perda recente</p>}
            </CardContent>
          </Card>

          {/* Health Scores */}
          <HealthScoreGauge score={healthScore} />
        </div>
      </div>
    </div>
  );
}