import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;
  const { id } = await context.params;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('publication_queue')
    .select('*, publication_logs(*)')
    .eq('id', id)
    .single();

  if (error || !data) return apiError('NOT_FOUND', 'URL not found', 404);

  const res = apiResponse(data);
  return addRateLimitHeaders(res, ctx);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;
  const { id } = await context.params;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('publication_queue')
    .update({
      status: 'RECEIVED',
      next_step: 'INDEXNOW',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data);
  return addRateLimitHeaders(res, ctx);
}
