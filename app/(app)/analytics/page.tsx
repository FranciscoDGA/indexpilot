'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface ExecutiveData {
  period: string;
  metrics: any[];
  kpis: any[];
  alerts: any[];
  site_health: any;
  seo_summary: any;
  content_summary: any;
  competitor_summary: any;
  ai_summary: any;
  billing_summary: any;
}

const trendIcons: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
  new: '+',
};

const trendColors: Record<string, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-600',
  new: 'text-blue-600',
};

export default function AnalyticsExecutivePage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchExecutiveData();
  }, [period]);

  const fetchExecutiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/executive?tenant_id=demo-tenant&period=${period}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error('Failed to fetch executive data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6"><PageHeader title="Executive Analytics" /><p className="text-gray-500 mt-4">Loading...</p></div>;
  if (!data) return <div className="p-6"><PageHeader title="Executive Analytics" /><p className="text-red-500 mt-4">Failed to load data</p></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Executive Analytics" description="Strategic overview and key performance indicators" />

      {/* Period Selector */}
      <div className="flex gap-2">
        {['7d', '30d', '90d', '1y'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded text-sm ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.slice(0, 8).map((kpi) => (
          <Card key={kpi.id}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.name}</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold">{kpi.latest_value ?? '—'}</p>
                {kpi.trend && (
                  <span className={`text-sm font-medium ${trendColors[kpi.trend]}`}>
                    {trendIcons[kpi.trend]} {kpi.trend_pct ? `${Math.abs(kpi.trend_pct)}%` : ''}
                  </span>
                )}
              </div>
              {kpi.unit && <p className="text-xs text-gray-400 mt-1">{kpi.unit}</p>}
              {kpi.target_value !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${kpi.target_met ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(100, ((kpi.latest_value || 0) / kpi.target_value) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Target: {kpi.target_value}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Site Health</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Avg Uptime</span><span className="font-medium">{data.site_health.avg_uptime_pct}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg Response</span><span className="font-medium">{data.site_health.avg_response_time_ms}ms</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">SEO Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Indexed URLs</span><span className="font-medium">{data.seo_summary.total_indexed_urls.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg SEO Score</span><span className="font-medium">{data.seo_summary.avg_seo_score}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Content</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Articles</span><span className="font-medium">{data.content_summary.total_articles}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Topic Clusters</span><span className="font-medium">{data.content_summary.topic_clusters}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI & Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">AI Usage</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Total Queries</p><p className="text-lg font-bold">{data.ai_summary.total_queries}</p></div>
              <div><p className="text-gray-500">Acceptance Rate</p><p className="text-lg font-bold">{data.ai_summary.acceptance_rate}%</p></div>
              <div><p className="text-gray-500">Time Saved</p><p className="text-lg font-bold">{Math.round(data.ai_summary.time_saved_minutes / 60)}h</p></div>
              <div><p className="text-gray-500">Cost</p><p className="text-lg font-bold">${data.ai_summary.cost_usd.toFixed(2)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Billing</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">MRR</p><p className="text-lg font-bold">${data.billing_summary.mrr.toLocaleString()}</p></div>
              <div><p className="text-gray-500">ARR</p><p className="text-lg font-bold">${data.billing_summary.arr.toLocaleString()}</p></div>
              <div><p className="text-gray-500">Active Subs</p><p className="text-lg font-bold">{data.billing_summary.active_subscriptions}</p></div>
              <div><p className="text-gray-500">Churn Rate</p><p className="text-lg font-bold">{data.billing_summary.churn_rate}%</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Recent Alerts</h3>
            <div className="space-y-2">
              {data.alerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge className={alert.severity === 'critical' ? 'bg-red-100 text-red-800' : alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm">{alert.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}