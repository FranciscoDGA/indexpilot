'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

export default function MemoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/memory?tenant_id=demo-tenant')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><PageHeader title="AI Memory" description="Learning history and patterns" /><p className="text-gray-500 mt-4">Loading...</p></div>;

  const memory = data?.memory || [];
  const stats = data?.stats || { total_memories: 0, positive_outcomes: 0, negative_outcomes: 0, total_learnings: 0, high_confidence_learnings: 0, avg_confidence: 0 };
  const patterns = data?.topPatterns || [];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="AI Memory" description="Learning history, patterns, and operational knowledge" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Total Memories</p><p className="text-2xl font-bold">{stats.total_memories}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Positive Outcomes</p><p className="text-2xl font-bold text-green-600">{stats.positive_outcomes}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Learnings</p><p className="text-2xl font-bold">{stats.total_learnings}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500">Avg Confidence</p><p className="text-2xl font-bold">{stats.avg_confidence}%</p></CardContent></Card>
      </div>

      {/* Top Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Learned Patterns</h3>
            <div className="space-y-2">
              {patterns.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-sm">{p.pattern_key}</span>
                    <span className="text-xs text-gray-500 ml-2">({p.pattern_type})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>{p.occurrences} occurrences</span>
                    <span>{Math.round(p.success_rate * 100)}% success</span>
                    <Badge className={p.confidence >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{p.confidence}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory History */}
      {memory.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Recent Memory</h3>
            <div className="space-y-2">
              {memory.slice(0, 15).map((m: any) => (
                <div key={m.id} className="p-2 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={m.outcome === 'positive' ? 'bg-green-100 text-green-800' : m.outcome === 'negative' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>{m.outcome || 'pending'}</Badge>
                      <span className="text-sm font-medium">{m.action_taken}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  {m.lessons_learned && m.lessons_learned.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.lessons_learned.map((l: string, i: number) => (
                        <span key={i} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{l}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}