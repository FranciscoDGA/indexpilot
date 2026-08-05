'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

export default function MissionControlPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/decisions?tenant_id=demo-tenant')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setData(json.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="Mission Control" description="AI Operations Center" /><p className="text-gray-500 mt-4">Loading...</p></div>;

  const stats = data?.stats || { total: 0, pending: 0, approved: 0, completed: 0, avg_confidence: 0 };
  const decisions = data?.decisions || [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Mission Control" description="AI Operations Center — IndexPilot OS 1.0" />

      {/* Mission Statement */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <h2 className="text-lg font-semibold">Mission Today</h2>
          </div>
          <p className="text-gray-700 text-lg">
            {stats.pending > 0
              ? `${stats.pending} decision${stats.pending > 1 ? 's' : ''} awaiting approval. ${stats.avg_confidence}% average confidence.`
              : 'All systems operational. No urgent actions required.'}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Total Decisions</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600">{stats.approved}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-blue-600">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Avg Confidence</p><p className="text-2xl font-bold">{stats.avg_confidence}%</p></CardContent></Card>
      </div>

      {/* Pending Decisions */}
      {decisions.filter((d: any) => d.status === 'pending').length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Pending Decisions</h3>
            <div className="space-y-3">
              {decisions.filter((d: any) => d.status === 'pending').slice(0, 5).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={d.urgency === 'critical' ? 'bg-red-100 text-red-800' : d.urgency === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>{d.urgency}</Badge>
                      <span className="font-medium">{d.title}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{d.reasoning?.substring(0, 100)}...</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Confidence: {d.confidence}%</span>
                      <span>Impact: {d.impact_score}/100</span>
                      <span>Type: {d.decision_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Approve</button>
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Decisions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Recent Decisions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Title</th><th>Type</th><th>Confidence</th><th>Impact</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {decisions.slice(0, 10).map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="font-medium">{d.title}</td>
                    <td className="text-gray-500">{d.decision_type}</td>
                    <td>{d.confidence}%</td>
                    <td>{d.impact_score}/100</td>
                    <td><Badge className={d.status === 'completed' ? 'bg-green-100 text-green-800' : d.status === 'approved' ? 'bg-blue-100 text-blue-800' : d.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>{d.status}</Badge></td>
                    <td className="text-gray-400">{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}