import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const siteId = searchParams.get('site_id') || 'site-1';
  const eventType = searchParams.get('event_type');
  const severity = searchParams.get('severity');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const { data: events, error } = await supabase
    .from('monitoring_events')
    .select('*')
    .eq('site_id', siteId)
    .order('detected_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const filtered = events?.filter((e: any) => {
    if (eventType && e.event_type !== eventType) return false;
    if (severity && e.severity !== severity) return false;
    return true;
  }) || [];

  return Response.json({
    data: filtered,
    total: filtered.length,
    limit,
    offset,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { site_id, event_type, severity, source, payload } = body;

  if (!site_id || !event_type || !severity) {
    return Response.json(
      { error: 'site_id, event_type, and severity are required' },
      { status: 400 }
    );
  }

  const { data: event, error } = await supabase
    .from('monitoring_events')
    .insert({
      site_id,
      event_type,
      severity,
      source: source || 'manual',
      payload: payload || {},
      detected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: event }, { status: 201 });
}