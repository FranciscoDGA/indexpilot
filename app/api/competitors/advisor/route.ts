import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIAdvisor, BenchmarkEngine, ContentGapAnalyzer, OpportunityEngine } from '@/lib/competitors';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { question, workspace_id, competitor_id } = body;

  if (!question) {
    return Response.json({ error: 'question is required' }, { status: 400 });
  }

  const wid = workspace_id || 'site-1';

  // Fetch data
  const [competitorsRes, benchmarksRes, gapsRes, oppsRes] = await Promise.all([
    supabase.from('competitors').select('*').eq('workspace_id', wid),
    competitor_id
      ? supabase.from('benchmarks').select('*').eq('workspace_id', wid).eq('competitor_id', competitor_id)
      : Promise.resolve({ data: [] }),
    supabase.from('content_gaps').select('*').eq('workspace_id', wid),
    supabase.from('competitive_opportunities').select('*').eq('workspace_id', wid),
  ]);

  const competitors = competitorsRes.data || [];
  const benchmarks = benchmarksRes.data || [];
  const gaps = gapsRes.data || [];
  const opportunities = oppsRes.data || [];

  // Get my site stats
  const { data: mySite } = await supabase
    .from('publications')
    .select('id')
    .eq('site_id', wid);

  const mySiteStats = {
    total_publications: mySite?.length || 0,
  };

  // Generate answer
  const advisor = new AIAdvisor();
  const response = await advisor.answerQuestion(
    question,
    competitors,
    benchmarks,
    gaps,
    opportunities,
    mySiteStats
  );

  return Response.json({ data: response });
}