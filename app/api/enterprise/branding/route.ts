import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return Response.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  const { data: config, error } = await supabase
    .from('white_label_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: config || null });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { tenant_id, platform_name, logo_url, favicon_url, primary_color, secondary_color, accent_color } = body;

  if (!tenant_id) {
    return Response.json({ error: 'tenant_id is required' }, { status: 400 });
  }

  // Check if config exists
  const { data: existing } = await supabase
    .from('white_label_configs')
    .select('id')
    .eq('tenant_id', tenant_id)
    .single();

  if (existing) {
    // Update
    const { data: config, error } = await supabase
      .from('white_label_configs')
      .update({
        platform_name,
        logo_url,
        favicon_url,
        primary_color,
        secondary_color,
        accent_color,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenant_id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: config });
  } else {
    // Create
    const { data: config, error } = await supabase
      .from('white_label_configs')
      .insert({
        tenant_id,
        platform_name: platform_name || 'IndexPilot',
        logo_url,
        favicon_url,
        primary_color: primary_color || '#3B82F6',
        secondary_color: secondary_color || '#10B981',
        accent_color: accent_color || '#F59E0B',
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: config }, { status: 201 });
  }
}