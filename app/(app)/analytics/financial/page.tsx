'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';

export default function AnalyticsFinancialPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/executive?tenant_id=demo-tenant&period=90d')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="Financial Analytics" /><p className="text-gray-500 mt-4">Loading...</p></div>;
  if (!data) return <div className="p-6"><PageHeader title="Financial Analytics" /><p className="text-red-500 mt-4">No data available</p></div>;

  const b = data.billing_summary;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Financial Analytics" description="Revenue, subscriptions, and billing metrics" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">MRR</p><p className="text-2xl font-bold">${b.mrr.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">ARR</p><p className="text-2xl font-bold">${b.arr.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Active Subscriptions</p><p className="text-2xl font-bold">{b.active_subscriptions}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Churn Rate</p><p className="text-2xl font-bold text-red-600">{b.churn_rate}%</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Net Revenue</p><p className="text-lg font-bold">${b.net_revenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">ARPU</p><p className="text-lg font-bold">${b.active_subscriptions > 0 ? Math.round(b.mrr / b.active_subscriptions) : 0}</p></CardContent></Card>
      </div>
    </div>
  );
}