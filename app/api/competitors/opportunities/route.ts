import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpportunityEngine } from '@/lib/competitors';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const workspaceId = searchParams.get('workspace_id') || 'site-1';

  const engine = new OpportunityEngine();
  const opportunities = await engine.getOpportunities(workspaceId);

  return Response.json({ data: opportunities });
}