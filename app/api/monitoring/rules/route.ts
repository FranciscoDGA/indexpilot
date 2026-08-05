import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const workspaceId = searchParams.get('workspace_id') || 'workspace-1';

  const { data: rules, error } = await supabase
    .from('monitoring_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: rules || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const { workspace_id, name, description, trigger_type, trigger_config, action_type, action_config } = body;

  if (!workspace_id || !name || !trigger_type || !action_type) {
    return Response.json(
      { error: 'workspace_id, name, trigger_type, and action_type are required' },
      { status: 400 }
    );
  }

  const { data: rule, error } = await supabase
    .from('monitoring_rules')
    .insert({
      workspace_id,
      name,
      description: description || '',
      trigger_type,
      trigger_config: trigger_config || {},
      action_type,
      action_config: action_config || {},
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data: rule }, { status: 201 });
}