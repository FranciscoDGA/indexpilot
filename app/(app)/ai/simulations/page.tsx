'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

const scenarioTypes = [
  { value: 'content_growth', label: 'Content Growth' },
  { value: 'indexation_forecast', label: 'Indexation Forecast' },
  { value: 'error_reduction', label: 'Error Reduction' },
  { value: 'traffic_projection', label: 'Traffic Projection' },
  { value: 'revenue_model', label: 'Revenue Model' },
];

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('content_growth');
  const [simName, setSimName] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/api/ai/simulate?tenant_id=demo-tenant')
      .then(r => r.json())
      .then(json => { if (json.success) setSimulations(json.data || []); })
      .finally(() => setLoading(false));
  }, []);

  const runSimulation = async () => {
    if (!simName) return;
    setRunning(true);
    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'demo-tenant',
          scenario_type: selectedType,
          name: simName,
          input_params: {},
          time_horizon_days: 90,
        }),
      });
      const json = await res.json();
      if (json.success) setSimulations([json.data, ...simulations]);
    } finally {
      setRunning(false);
      setSimName('');
    }
  };

  if (loading) return <div className="p-6"><PageHeader title="Scenario Simulator" description="Simulate future outcomes" /><p className="text-gray-500 mt-4">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Scenario Simulator" description="Project future outcomes based on current trends" />

      {/* New Simulation */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Run New Simulation</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Name</label>
              <input value={simName} onChange={e => setSimName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded text-sm" placeholder="e.g., 90-day content growth forecast" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Scenario</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded text-sm">
                {scenarioTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <button onClick={runSimulation} disabled={running || !simName} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
              {running ? 'Running...' : 'Simulate'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Simulations List */}
      {simulations.length > 0 ? (
        <div className="space-y-4">
          {simulations.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{s.name}</h3>
                    <Badge className="bg-purple-100 text-purple-800">{s.scenario_type}</Badge>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                {s.description && <p className="text-sm text-gray-600 mb-2">{s.description}</p>}

                {s.predicted_outcomes && Object.keys(s.predicted_outcomes).length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-2">Predicted Outcomes ({s.time_horizon_days} days)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(s.predicted_outcomes).filter(([k]) => !['confidence', 'timeline_months', 'note'].includes(k)).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500">{key.replace(/_/g, ' ')}: </span>
                          <span className="font-medium">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                        </div>
                      ))}
                    </div>
                    {s.predicted_outcomes.confidence && (
                      <p className="text-xs text-blue-600 mt-2">Confidence: {s.predicted_outcomes.confidence}%</p>
                    )}
                  </div>
                )}

                {s.assumptions && s.assumptions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Assumptions:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {s.assumptions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-8 text-center text-gray-500">No simulations yet. Run your first simulation above.</CardContent></Card>
      )}
    </div>
  );
}