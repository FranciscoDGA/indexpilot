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
  const { data: site, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .single();

  if (error || !site) return apiError('NOT_FOUND', 'Site not found', 404);

  const res = apiResponse(site);
  return addRateLimitHeaders(res, ctx);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;
  const { id } = await context.params;

  const body = await request.json();
  const supabase = createClient();

  const { data: site, error } = await supabase
    .from('sites')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(site);
  return addRateLimitHeaders(res, ctx);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;
  const { id } = await context.params;

  const supabase = createClient();
  const { error } = await supabase
    .from('sites')
    .delete()
    .eq('id', id)
    .eq('user_id', ctx.userId);

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse({ deleted: true });
  return addRateLimitHeaders(res, ctx);
}
