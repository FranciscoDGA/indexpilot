import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: tenants || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { name, slug, plan } = body;

  if (!name || !slug) {
    return Response.json(
      { error: 'name and slug are required' },
      { status: 400 }
    );
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      plan: plan || 'free',
      status: 'active',
      limits: {},
      settings: {},
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Create default workspace
  await supabase.from('workspaces').insert({
    tenant_id: tenant.id,
    name: 'Default Workspace',
    slug: 'default',
  });

  // Create white label defaults
  await supabase.from('white_label_configs').insert({
    tenant_id: tenant.id,
    platform_name: 'IndexPilot',
  });

  return Response.json({ data: tenant }, { status: 201 });
}