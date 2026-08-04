import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get('site_id');
    const logId = request.nextUrl.searchParams.get('log_id');

    if (!siteId && !logId) {
      return NextResponse.json(
        { error: 'Missing required parameters: site_id or log_id' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/client')).supabase;

    let query = supabaseClient.from('sync_logs').select('*');

    if (logId) {
      query = query.eq('id', logId);
    } else if (siteId) {
      query = query.eq('site_id', siteId).order('created_at', { ascending: false }).limit(1);
    }

    const result = await query.single();

    if (result.error) {
      return NextResponse.json(
        { error: 'Sync log not found' },
        { status: 404 }
      );
    }

    const syncLog = result.data;

    const urlsResult = await supabaseClient
      .from('urls')
      .select('id, is_indexed, is_orphaned')
      .eq('site_id', siteId || syncLog.site_id);

    const urls = urlsResult.data || [];
    const indexedCount = urls.filter((u: any) => u.is_indexed).length;
    const orphanedCount = urls.filter((u: any) => u.is_orphaned).length;

    return NextResponse.json({
      log: syncLog,
      summary: {
        total_urls: urls.length,
        indexed_urls: indexedCount,
        not_indexed_urls: urls.length - indexedCount,
        orphaned_urls: orphanedCount,
      },
    });
  } catch (error) {
    console.error('Discovery status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discovery status' },
      { status: 500 }
    );
  }
}
