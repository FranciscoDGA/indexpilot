'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

export default function GoalsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/goals?tenant_id=demo-tenant')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="AI Goals" description="Track objectives and progress" /><p className="text-gray-500 mt-4">Loading...</p></div>;

  const goals = data?.goals || [];
  const stats = data?.stats || { total: 0, active: 0, completed: 0, avg_progress: 0, at_risk: 0 };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="AI Goals" description="Objectives tracked by the AI Operations Center" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-bold text-blue-600">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Avg Progress</p><p className="text-2xl font-bold">{stats.avg_progress}%</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">At Risk</p><p className="text-2xl font-bold text-red-600">{stats.at_risk}</p></CardContent></Card>
      </div>

      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((g: any) => (
            <Card key={g.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{g.title}</h3>
                    <Badge className={g.status === 'completed' ? 'bg-green-100 text-green-800' : g.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>{g.status}</Badge>
                  </div>
                  <span className="text-sm text-gray-500">{g.category}</span>
                </div>
                {g.description && <p className="text-sm text-gray-600 mb-2">{g.description}</p>}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{g.progress_pct}% complete</span>
                    <span>Target: {g.target_value} | Current: {g.current_value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${g.progress_pct >= 80 ? 'bg-green-500' : g.progress_pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, g.progress_pct)}%` }} />
                  </div>
                </div>
                {g.deadline && (
                  <p className="text-xs text-gray-400 mt-2">Deadline: {new Date(g.deadline).toLocaleDateString()}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-8 text-center text-gray-500">No goals configured. Create goals to track AI-driven objectives.</CardContent></Card>
      )}
    </div>
  );
}