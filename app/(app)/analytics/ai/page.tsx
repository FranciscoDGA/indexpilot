'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';

export default function AnalyticsAIPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/executive?tenant_id=demo-tenant&period=30d')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="AI Analytics" /><p className="text-gray-500 mt-4">Loading...</p></div>;
  if (!data) return <div className="p-6"><PageHeader title="AI Analytics" /><p className="text-red-500 mt-4">No data available</p></div>;

  const a = data.ai_summary;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="AI Analytics" description="AI Copilot usage, recommendations, and efficiency" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Queries</p><p className="text-2xl font-bold">{a.total_queries}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Acceptance Rate</p><p className="text-2xl font-bold">{a.acceptance_rate}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Time Saved</p><p className="text-2xl font-bold">{Math.round(a.time_saved_minutes / 60)}h</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Automations Run</p><p className="text-2xl font-bold">{a.automations_executed}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">AI Cost</p><p className="text-lg font-bold">${a.cost_usd.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Time Saved (min)</p><p className="text-lg font-bold">{a.time_saved_minutes.toLocaleString()}</p></CardContent></Card>
      </div>
    </div>
  );
}