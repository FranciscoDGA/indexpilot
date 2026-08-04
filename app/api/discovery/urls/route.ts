import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get('site_id');
    const filter = request.nextUrl.searchParams.get('filter') || 'all';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required parameter: site_id' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/client')).supabase;

    let query = supabaseClient
      .from('urls')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId);

    if (filter === 'indexed') {
      query = query.eq('is_indexed', true);
    } else if (filter === 'not_indexed') {
      query = query.eq('is_indexed', false);
    } else if (filter === 'orphaned') {
      query = query.eq('is_orphaned', true);
    } else if (filter === 'errors') {
      query = query.gt('http_status', 399);
    }

    const offset = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const result = await query;

    return NextResponse.json({
      data: result.data || [],
      count: result.count || 0,
      page,
      limit,
      total_pages: Math.ceil((result.count || 0) / limit),
    });
  } catch (error) {
    console.error('URLs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URLs' },
      { status: 500 }
    );
  }
}
