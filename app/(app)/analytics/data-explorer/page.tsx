'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

const modules = ['seo', 'crawl', 'content', 'competitor', 'ai', 'billing', 'monitoring', 'automation'];

export default function DataExplorerPage() {
  const [selectedModule, setSelectedModule] = useState('seo');
  const [columns, setColumns] = useState<any[]>([]);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState<any[]>([]);

  useEffect(() => {
    fetchColumns();
    fetchSavedQueries();
  }, [selectedModule]);

  const fetchColumns = async () => {
    const res = await fetch(`/api/analytics/query?action=columns&module=${selectedModule}`);
    const json = await res.json();
    if (json.success) setColumns(json.data);
  };

  const fetchSavedQueries = async () => {
    const res = await fetch('/api/analytics/query?tenant_id=demo-tenant');
    const json = await res.json();
    if (json.success) setSavedQueries(json.data || []);
  };

  const executeQuery = async () => {
    setLoading(true);
    try {
      const metrics = columns.filter(c => c.visible).map(c => c.key);
      const res = await fetch('/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          tenant_id: 'demo-tenant',
          module: selectedModule,
          date_range: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
          metrics,
          limit: 100,
        }),
      });
      const json = await res.json();
      if (json.success) setQueryResult(json.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Data Explorer" description="Ad-hoc analytics queries across all data modules" />

      {/* Module Selector */}
      <div className="flex gap-2 flex-wrap">
        {modules.map(m => (
          <button
            key={m}
            onClick={() => { setSelectedModule(m); setQueryResult(null); }}
            className={`px-3 py-1 rounded text-sm capitalize ${selectedModule === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columns */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Available Columns</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {columns.map(col => (
                <div key={col.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-600">{col.type}</Badge>
                    <span>{col.label}</span>
                  </div>
                  {col.aggregate && <span className="text-xs text-gray-400">{col.aggregate}</span>}
                </div>
              ))}
            </div>
            <button
              onClick={executeQuery}
              disabled={loading}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Running...' : 'Execute Query'}
            </button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Results</h3>
              {queryResult ? (
                <div>
                  <p className="text-xs text-gray-500 mb-2">{queryResult.total} rows in {queryResult.query_time_ms}ms</p>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          {columns.filter(c => c.visible).map(col => (
                            <th key={col.key} className="pb-2 pr-4">{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.data.slice(0, 50).map((row: any, i: number) => (
                          <tr key={i} className="border-t">
                            {columns.filter(c => c.visible).map(col => (
                              <td key={col.key} className="py-1 pr-4">
                                {typeof row[col.key] === 'number' ? row[col.key].toLocaleString() : String(row[col.key] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Select a module and execute a query to see results</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Queries */}
      {savedQueries.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Saved Queries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {savedQueries.map(q => (
                <div key={q.id} className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                  <p className="font-medium text-sm">{q.name}</p>
                  <p className="text-xs text-gray-500">{q.query_config?.module || '—'}</p>
                  {q.is_starred && <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1">Starred</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}