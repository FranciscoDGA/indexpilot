import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const siteId = searchParams.get('site_id') || 'site-1';
  const url = searchParams.get('url');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('monitoring_snapshots')
    .select('*')
    .eq('site_id', siteId)
    .order('captured_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (url) {
    query = query.eq('url', url);
  }

  const { data: snapshots, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    data: snapshots || [],
    total: snapshots?.length || 0,
    limit,
    offset,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { site_id, url, status_code, response_time_ms, content_hash, snapshot } = body;

  if (!site_id || !url) {
    return Response.json(
      { error: 'site_id and url are required' },
      { status: 400 }
    );
  }

  const { data: snapshotRecord, error } = await supabase
    .from('monitoring_snapshots')
    .insert({
      site_id,
      url,
      status_code: status_code || 200,
      response_time_ms: response_time_ms || 0,
      content_hash: content_hash || '',
      snapshot: snapshot || {},
      captured_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: snapshotRecord }, { status: 201 });
}