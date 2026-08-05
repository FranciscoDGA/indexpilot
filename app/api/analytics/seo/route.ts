import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FactSEO } from '@/types/analytics';

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
    else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

    let query = supabase
      .from('fact_seo')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) throw error;

    const records = (data || []) as FactSEO[];

    // Compute summary
    const latest = records.length > 0 ? records[records.length - 1] : null;
    const previous = records.length > 1 ? records[records.length - 2] : null;

    const avgSeoScore = records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.seo_score, 0) / records.length * 100) / 100
      : 0;

    const totalIndexed = latest?.indexed_urls || 0;
    const totalUrls = latest?.total_urls || 0;
    const indexationRate = totalUrls > 0 ? Math.round((totalIndexed / totalUrls) * 10000) / 100 : 0;

    const avgTraffic = records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.organic_traffic, 0) / records.length)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          avg_seo_score: avgSeoScore,
          indexed_urls: totalIndexed,
          total_urls: totalUrls,
          indexation_rate: indexationRate,
          organic_traffic_avg: avgTraffic,
          total_errors: latest?.crawl_errors || 0,
          total_backlinks: latest?.backlinks_count || 0,
          avg_ctr: latest?.avg_ctr || 0,
          avg_position: latest?.avg_position || 0,
        },
        trend: records.map(r => ({
          date: r.created_at,
          seo_score: r.seo_score,
          indexed_urls: r.indexed_urls,
          organic_traffic: r.organic_traffic,
          crawl_errors: r.crawl_errors,
        })),
        change: previous && latest ? {
          seo_score: latest.seo_score - previous.seo_score,
          indexed_urls: latest.indexed_urls - previous.indexed_urls,
          organic_traffic: latest.organic_traffic - previous.organic_traffic,
        } : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}