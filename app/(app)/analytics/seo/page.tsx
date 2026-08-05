'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';

export default function AnalyticsSEOPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/seo?tenant_id=demo-tenant&period=30d')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="SEO Analytics" /><p className="text-gray-500 mt-4">Loading...</p></div>;
  if (!data) return <div className="p-6"><PageHeader title="SEO Analytics" /><p className="text-red-500 mt-4">No data available</p></div>;

  const s = data.summary;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="SEO Analytics" description="Search engine optimization metrics and trends" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">SEO Score</p><p className="text-2xl font-bold">{s.avg_seo_score}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Indexed URLs</p><p className="text-2xl font-bold">{s.indexed_urls.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Indexation Rate</p><p className="text-2xl font-bold">{s.indexation_rate}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Errors</p><p className="text-2xl font-bold text-red-600">{s.total_errors}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Organic Traffic (avg)</p><p className="text-lg font-bold">{s.organic_traffic_avg.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Avg CTR</p><p className="text-lg font-bold">{s.avg_ctr}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Avg Position</p><p className="text-lg font-bold">{s.avg_position}</p></CardContent></Card>
      </div>

      {data.change && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Period Change</h3>
            <div className="flex gap-6 text-sm">
              <span>SEO Score: <span className={data.change.seo_score >= 0 ? 'text-green-600' : 'text-red-600'}>{data.change.seo_score >= 0 ? '+' : ''}{data.change.seo_score}</span></span>
              <span>Indexed: <span className={data.change.indexed_urls >= 0 ? 'text-green-600' : 'text-red-600'}>{data.change.indexed_urls >= 0 ? '+' : ''}{data.change.indexed_urls}</span></span>
              <span>Traffic: <span className={data.change.organic_traffic >= 0 ? 'text-green-600' : 'text-red-600'}>{data.change.organic_traffic >= 0 ? '+' : ''}{data.change.organic_traffic.toLocaleString()}</span></span>
            </div>
          </CardContent>
        </Card>
      )}

      {data.trend.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Trend Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th>Date</th><th>SEO Score</th><th>Indexed</th><th>Traffic</th><th>Errors</th></tr></thead>
                <tbody>
                  {data.trend.slice(-10).map((t: any, i: number) => (
                    <tr key={i} className="border-t"><td>{new Date(t.date).toLocaleDateString()}</td><td>{t.seo_score}</td><td>{t.indexed_urls.toLocaleString()}</td><td>{t.organic_traffic.toLocaleString()}</td><td className="text-red-600">{t.crawl_errors}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}