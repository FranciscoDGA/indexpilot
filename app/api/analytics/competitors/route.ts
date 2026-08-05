import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FactCompetitor } from '@/types/analytics';

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
      .from('fact_competitors')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (siteId) query = query.eq('site_id', siteId);

    const { data, error } = await query;
    if (error) throw error;

    const records = (data || []) as FactCompetitor[];

    // Group by competitor
    const competitorMap = new Map<string, { name: string; domain: string; records: FactCompetitor[] }>();
    for (const r of records) {
      const key = r.competitor_id;
      if (!competitorMap.has(key)) {
        competitorMap.set(key, { name: r.competitor_name, domain: r.competitor_domain, records: [] });
      }
      competitorMap.get(key)!.records.push(r);
    }

    const competitors = Array.from(competitorMap.entries()).map(([id, { name, domain, records: recs }]) => {
      const latest = recs[recs.length - 1];
      return {
        competitor_id: id,
        name,
        domain,
        current_pages: latest?.competitor_pages || 0,
        page_growth_pct: latest?.page_growth_pct || 0,
        estimated_traffic: latest?.estimated_traffic || 0,
        traffic_growth_pct: latest?.traffic_growth_pct || 0,
        market_share_pct: latest?.market_share_pct || 0,
        domain_authority: latest?.domain_authority || 0,
        content_gaps: latest?.content_gap_count || 0,
      };
    });

    // Find biggest grower/decliner
    const sorted = [...competitors].sort((a, b) => b.page_growth_pct - a.page_growth_pct);

    return NextResponse.json({
      success: true,
      data: {
        total_competitors: competitors.length,
        competitors,
        biggest_grower: sorted[0] || null,
        biggest_decliner: sorted[sorted.length - 1] || null,
        avg_market_share: competitors.length > 0
          ? Math.round(competitors.reduce((s, c) => s + c.market_share_pct, 0) / competitors.length * 100) / 100
          : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}