import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const workspaceId = searchParams.get('workspace_id') || 'site-1';

  const { data: competitors, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: competitors || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { workspace_id, name, domain, category, country, language, priority, notes } = body;

  if (!workspace_id || !name || !domain) {
    return Response.json(
      { error: 'workspace_id, name, and domain are required' },
      { status: 400 }
    );
  }

  const { data: competitor, error } = await supabase
    .from('competitors')
    .insert({
      workspace_id,
      name,
      domain,
      category: category || 'direct',
      country: country || 'BR',
      language: language || 'pt-BR',
      priority: priority || 'medium',
      status: 'active',
      notes: notes || '',
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: competitor }, { status: 201 });
}