import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get('tenant_id');
  const action = searchParams.get('action');
  const resourceType = searchParams.get('resource_type');
  const userId = searchParams.get('user_id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!tenantId) {
    return Response.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (action) query = query.eq('action', action);
  if (resourceType) query = query.eq('resource_type', resourceType);
  if (userId) query = query.eq('user_id', userId);

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: logs, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    data: logs || [],
    total: count || 0,
    limit,
    offset,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent } = body;

  if (!tenant_id || !action) {
    return Response.json(
      { error: 'tenant_id and action are required' },
      { status: 400 }
    );
  }

  const { data: log, error } = await supabase
    .from('audit_logs')
    .insert({
      tenant_id,
      user_id,
      action,
      resource_type,
      resource_id,
      details: details || {},
      ip_address,
      user_agent,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: log }, { status: 201 });
}