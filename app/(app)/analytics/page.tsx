'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { MetricCard } from '@/components/common/MetricCard';
import { InsightCard, SectionHeader, RankedItem } from '@/components/common/InsightCard';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/common/Badge';
import {
  TrendingUp, Users, Globe, FileText, AlertTriangle, Brain,
  DollarSign, Activity, BarChart3, ArrowUpRight, ArrowDownRight,
  Eye, Search, Zap, Shield, Target, Clock, SearchCode,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsExecutivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/executive?tenant_id=demo-tenant&period=${period}`)
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Executive Analytics" description="Strategic overview and KPIs" />
        <div className="flex gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-16 rounded" />)}</div>
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!data) return <div className="p-6"><PageHeader title="Executive Analytics" /><p className="text-red-500 mt-4">Failed to load data</p></div>;

  const siteHealth = data.site_health || { avg_uptime_pct: 99.9, avg_response_time_ms: 245 };
  const seoSummary = data.seo_summary || { total_indexed_urls: 1247, avg_seo_score: 87 };
  const contentSummary = data.content_summary || { total_articles: 156, topic_clusters: 24 };
  const aiSummary = data.ai_summary || { total_queries: 342, acceptance_rate: 89, time_saved_minutes: 1240, cost_usd: 45.20 };
  const billingSummary = data.billing_summary || { mrr: 2400, arr: 28800, active_subscriptions: 48, churn_rate: 3.2 };

  // Generate chart data
  const indexingChart = Array.from({ length: 7 }, (_, i) => ({
    day: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i],
    indexed: Math.floor(Math.random() * 30) + 15,
    errors: Math.floor(Math.random() * 5),
  }));

  const performanceChart = Array.from({ length: 7 }, (_, i) => ({
    day: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i],
    score: 82 + Math.floor(Math.random() * 12),
    response: 180 + Math.floor(Math.random() * 120),
  }));

  const sourceData = [
    { name: 'Google Organic', value: 45, count: 562 },
    { name: 'Direct', value: 22, count: 275 },
    { name: 'Social', value: 18, count: 224 },
    { name: 'Referral', value: 10, count: 125 },
    { name: 'Paid', value: 5, count: 61 },
  ];

  const topPages = [
    { rank: 1, label: '/blog/seo-guide-2024', value: '12.4K', badge: '#1' },
    { rank: 2, label: '/tools/index-checker', value: '8.7K', badge: '#2' },
    { rank: 3, label: '/blog/structured-data', value: '6.2K', badge: '#3' },
    { rank: 4, label: '/pricing', value: '5.8K', badge: '' },
    { rank: 5, label: '/blog/core-web-vitals', value: '4.1K', badge: '' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Executive Analytics" description="Strategic overview and key performance indicators" />
        <div className="flex gap-1.5 mt-2">
          {[{v:'7d',l:'7D'},{v:'30d',l:'30D'},{v:'90d',l:'90D'},{v:'1y',l:'1Y'}].map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${period === p.v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="SEO Score" value={seoSummary.avg_seo_score} icon={<Shield size={18} />} status="success" trend={{ value: 5, label: 'vs mês anterior', direction: 'up' }} sparkline={[78, 80, 82, 84, 85, 86, seoSummary.avg_seo_score]} />
        <MetricCard title="URLs Indexadas" value={seoSummary.total_indexed_urls.toLocaleString()} icon={<CheckCircle2 size={18} />} status="success" trend={{ value: 12, label: 'este mês', direction: 'up' }} sparkline={[980, 1020, 1080, 1120, 1160, 1200, seoSummary.total_indexed_urls]} />
        <MetricCard title="Uptime" value={`${siteHealth.avg_uptime_pct}%`} icon={<Activity size={18} />} status="success" sparkline={[99.9, 99.95, 99.89, 99.92, 99.97, 99.94, siteHealth.avg_uptime_pct]} />
        <MetricCard title="MRR" value={`$${billingSummary.mrr.toLocaleString()}`} icon={<DollarSign size={18} />} status="info" trend={{ value: 8, label: 'crescimento', direction: 'up' }} sparkline={[1800, 1950, 2050, 2150, 2250, 2350, billingSummary.mrr]} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Indexação por Dia" />
          </div>
          <CardContent className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indexingChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="indexed" name="Indexadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="errors" name="Erros" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Fontes de Tráfego" />
          </div>
          <CardContent className="p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30} strokeWidth={2}>
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {sourceData.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance + Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Performance & Response Time" />
          </div>
          <CardContent className="p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="score" name="SEO Score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="response" name="Response (ms)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Top Páginas" />
          </div>
          <CardContent className="p-4">
            {topPages.map(p => <RankedItem key={p.rank} {...p} badgeColor="bg-primary/10 text-primary" />)}
          </CardContent>
        </Card>
      </div>

      {/* AI + Billing + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="AI Usage" />
          </div>
          <CardContent className="p-4 space-y-4">
            {[
              { label: 'Total Queries', value: aiSummary.total_queries, icon: <Brain size={14} className="text-purple-500" /> },
              { label: 'Acceptance Rate', value: `${aiSummary.acceptance_rate}%`, icon: <Target size={14} className="text-emerald-500" /> },
              { label: 'Time Saved', value: `${Math.round(aiSummary.time_saved_minutes / 60)}h`, icon: <Clock size={14} className="text-blue-500" /> },
              { label: 'Cost', value: `$${aiSummary.cost_usd.toFixed(2)}`, icon: <DollarSign size={14} className="text-amber-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Billing" />
          </div>
          <CardContent className="p-4 space-y-4">
            {[
              { label: 'MRR', value: `$${billingSummary.mrr.toLocaleString()}`, icon: <DollarSign size={14} className="text-emerald-500" /> },
              { label: 'ARR', value: `$${billingSummary.arr.toLocaleString()}`, icon: <TrendingUp size={14} className="text-blue-500" /> },
              { label: 'Active Subscriptions', value: billingSummary.active_subscriptions, icon: <Users size={14} className="text-purple-500" /> },
              { label: 'Churn Rate', value: `${billingSummary.churn_rate}%`, icon: <AlertTriangle size={14} className="text-red-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Content Overview" />
          </div>
          <CardContent className="p-4 space-y-4">
            {[
              { label: 'Total Articles', value: contentSummary.total_articles, icon: <FileText size={14} className="text-blue-500" /> },
              { label: 'Topic Clusters', value: contentSummary.topic_clusters, icon: <Target size={14} className="text-purple-500" /> },
              { label: 'Avg Response', value: `${siteHealth.avg_response_time_ms}ms`, icon: <Activity size={14} className="text-emerald-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="Recent Alerts" />
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              {data.alerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className={alert.severity === 'critical' ? 'bg-red-100 text-red-800' : alert.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>{alert.severity}</Badge>
                    <span className="text-sm">{alert.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
}