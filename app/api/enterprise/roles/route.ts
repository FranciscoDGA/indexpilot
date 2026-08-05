import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return Response.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: roles || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { tenant_id, name, description, permissions } = body;

  if (!tenant_id || !name) {
    return Response.json(
      { error: 'tenant_id and name are required' },
      { status: 400 }
    );
  }

  const { data: role, error } = await supabase
    .from('roles')
    .insert({
      tenant_id,
      name,
      description: description || '',
      permissions: permissions || [],
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: role }, { status: 201 });
}