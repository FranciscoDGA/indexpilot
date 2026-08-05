'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

export default function AnalyticsCompetitorsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/competitors?tenant_id=demo-tenant&period=30d')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="Competitor Analytics" /><p className="text-gray-500 mt-4">Loading...</p></div>;
  if (!data) return <div className="p-6"><PageHeader title="Competitor Analytics" /><p className="text-red-500 mt-4">No data available</p></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Competitor Analytics" description="Competitive intelligence and market positioning" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Tracked Competitors</p><p className="text-2xl font-bold">{data.total_competitors}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Avg Market Share</p><p className="text-2xl font-bold">{data.avg_market_share}%</p></CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Biggest Grower</p>
          {data.biggest_grower ? (
            <div><p className="text-lg font-bold">{data.biggest_grower.name}</p><p className="text-sm text-green-600">+{data.biggest_grower.page_growth_pct}%</p></div>
          ) : <p className="text-gray-400">—</p>}
        </CardContent></Card>
      </div>

      {data.competitors.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Competitor Overview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th>Competitor</th><th>Domain</th><th>Pages</th><th>Growth</th><th>Traffic</th><th>Market Share</th><th>Authority</th></tr></thead>
                <tbody>
                  {data.competitors.map((c: any) => (
                    <tr key={c.competitor_id} className="border-t">
                      <td className="font-medium">{c.name}</td>
                      <td className="text-gray-500">{c.domain}</td>
                      <td>{c.current_pages.toLocaleString()}</td>
                      <td><span className={c.page_growth_pct >= 0 ? 'text-green-600' : 'text-red-600'}>{c.page_growth_pct >= 0 ? '+' : ''}{c.page_growth_pct}%</span></td>
                      <td>{c.estimated_traffic.toLocaleString()}</td>
                      <td>{c.market_share_pct}%</td>
                      <td>{c.domain_authority}</td>
                    </tr>
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