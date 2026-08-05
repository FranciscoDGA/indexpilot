import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FactContent } from '@/types/analytics';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const siteId = searchParams.get('site_id');
    const period = searchParams.get('period') || '30d';

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

    let query = supabase
      .from('fact_content')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) throw error;

    const records = (data || []) as FactContent[];
    const latest = records.length > 0 ? records[records.length - 1] : null;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_articles: latest?.total_articles || 0,
          new_articles_period: records.reduce((s, r) => s + r.new_articles, 0),
          updated_articles_period: records.reduce((s, r) => s + r.updated_articles, 0),
          avg_quality: records.length > 0 ? Math.round(records.reduce((s, r) => s + r.avg_content_quality, 0) / records.length * 100) / 100 : 0,
          avg_freshness: records.length > 0 ? Math.round(records.reduce((s, r) => s + r.avg_freshness_score, 0) / records.length * 100) / 100 : 0,
          semantic_coverage: latest?.semantic_coverage || 0,
          topic_clusters: latest?.topic_clusters || 0,
          entities_detected: latest?.entities_detected || 0,
          cannibalization_issues: latest?.cannibalization_issues || 0,
          content_gaps: latest?.content_gaps_found || 0,
        },
        trend: records.map(r => ({
          date: r.created_at,
          total_articles: r.total_articles,
          new_articles: r.new_articles,
          avg_quality: r.avg_content_quality,
          semantic_coverage: r.semantic_coverage,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}