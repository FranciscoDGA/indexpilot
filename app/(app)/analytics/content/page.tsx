'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';

export default function AnalyticsContentPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/content?tenant_id=demo-tenant&period=30d')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="Content Analytics" /><p className="text-gray-500 mt-4">Loading...</p></div>;
  if (!data) return <div className="p-6"><PageHeader title="Content Analytics" /><p className="text-red-500 mt-4">No data available</p></div>;

  const s = data.summary;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Content Analytics" description="Content quality, freshness, and semantic coverage" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Articles</p><p className="text-2xl font-bold">{s.total_articles}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">New (Period)</p><p className="text-2xl font-bold text-green-600">+{s.new_articles_period}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Avg Quality</p><p className="text-2xl font-bold">{s.avg_quality}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Semantic Coverage</p><p className="text-2xl font-bold">{s.semantic_coverage}%</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Avg Freshness</p><p className="text-lg font-bold">{s.avg_freshness}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Topic Clusters</p><p className="text-lg font-bold">{s.topic_clusters}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Cannibalization Issues</p><p className="text-lg font-bold text-orange-600">{s.cannibalization_issues}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Content Gaps</p><p className="text-lg font-bold text-red-600">{s.content_gaps}</p></CardContent></Card>
      </div>

      {data.trend.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Content Trend</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th>Date</th><th>Articles</th><th>New</th><th>Quality</th><th>Coverage</th></tr></thead>
                <tbody>
                  {data.trend.slice(-10).map((t: any, i: number) => (
                    <tr key={i} className="border-t"><td>{new Date(t.date).toLocaleDateString()}</td><td>{t.total_articles}</td><td className="text-green-600">+{t.new_articles}</td><td>{t.avg_quality}</td><td>{t.semantic_coverage}%</td></tr>
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