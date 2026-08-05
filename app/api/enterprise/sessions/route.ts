import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('user_id');
  const tenantId = searchParams.get('tenant_id');

  if (!userId) {
    return Response.json({ error: 'user_id is required' }, { status: 400 });
  }

  let query = supabase
    .from('security_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString());

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: sessions, error } = await query.order('last_active_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: sessions || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { user_id, tenant_id, ip_address, user_agent, device_info } = body;

  if (!user_id || !tenant_id) {
    return Response.json(
      { error: 'user_id and tenant_id are required' },
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: session, error } = await supabase
    .from('security_sessions')
    .insert({
      user_id,
      tenant_id,
      ip_address,
      user_agent,
      device_info: device_info || {},
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: session }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const sessionId = searchParams.get('session_id');
  const userId = searchParams.get('user_id');

  if (sessionId) {
    // Revoke specific session
    const { error } = await supabase
      .from('security_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  } else if (userId) {
    // Revoke all sessions for user
    const { error } = await supabase
      .from('security_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  } else {
    return Response.json({ error: 'session_id or user_id is required' }, { status: 400 });
  }

  return Response.json({ data: { success: true } });
}