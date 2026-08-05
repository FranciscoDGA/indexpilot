import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const siteId = searchParams.get('site_id') || 'site-1';
  const status = searchParams.get('status');
  const severity = searchParams.get('severity');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('site_id', siteId)
    .order('opened_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const filtered = incidents?.filter((i: any) => {
    if (status && i.status !== status) return false;
    if (severity && i.severity !== severity) return false;
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

  const { site_id, title, description, severity, source, metadata } = body;

  if (!site_id || !title || !severity) {
    return Response.json(
      { error: 'site_id, title, and severity are required' },
      { status: 400 }
    );
  }

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert({
      site_id,
      title,
      description: description || '',
      severity,
      status: 'open',
      source: source || 'manual',
      metadata: metadata || {},
      opened_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: incident }, { status: 201 });
}