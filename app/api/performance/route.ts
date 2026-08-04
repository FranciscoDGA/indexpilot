import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'search';
    const siteId = request.nextUrl.searchParams.get('site_id');

    // Get Supabase client (mock or real)
    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/client')).supabase;

    let data: any[] = [];

    if (type === 'search') {
      // Get search performance data
      const query = supabaseClient
        .from('search_performance')
        .select('*');

      if (siteId) {
        query.eq('site_id', siteId);
      }

      const result = await query.order('date', { ascending: false }).limit(30);
      data = result.data || [];
    } else if (type === 'keywords') {
      // Get keyword performance data
      const query = supabaseClient
        .from('keyword_performance')
        .select('*');

      if (siteId) {
        query.eq('site_id', siteId);
      }

      const result = await query.order('impressions', { ascending: false }).limit(20);
      data = result.data || [];
    } else if (type === 'milestones') {
      // Get performance milestones
      const query = supabaseClient
        .from('performance_milestones')
        .select('*');

      if (siteId) {
        query.eq('site_id', siteId);
      }

      const result = await query.order('milestone_date', { ascending: false }).limit(10);
      data = result.data || [];
    }

    return NextResponse.json({
      type,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
