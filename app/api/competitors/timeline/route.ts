import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChangeMonitor } from '@/lib/competitors';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const workspaceId = searchParams.get('workspace_id') || 'site-1';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const monitor = new ChangeMonitor();
  const timeline = await monitor.getTimeline(workspaceId, limit);

  return Response.json({ data: timeline });
}