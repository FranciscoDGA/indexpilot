import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContentGapAnalyzer } from '@/lib/competitors';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const workspaceId = searchParams.get('workspace_id') || 'site-1';

  const analyzer = new ContentGapAnalyzer();
  const gaps = await analyzer.getGaps(workspaceId);

  return Response.json({ data: gaps });
}