import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BenchmarkEngine } from '@/lib/competitors';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const workspaceId = searchParams.get('workspace_id') || 'site-1';
  const competitorId = searchParams.get('competitor_id');

  if (!competitorId) {
    return Response.json({ error: 'competitor_id is required' }, { status: 400 });
  }

  const engine = new BenchmarkEngine();
  const benchmarks = await engine.getBenchmarks(workspaceId, competitorId);
  const comparisons = engine.compareBenchmarks(benchmarks);

  return Response.json({ data: comparisons });
}