import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data, { total: data?.length || 0 });
  return addRateLimitHeaders(res, ctx);
}

export async function POST(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const body = await request.json();
  const { workspace_id, url, events, secret } = body;

  if (!workspace_id || !url || !events) {
    return apiError('VALIDATION_ERROR', 'workspace_id, url, and events are required');
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('webhook_subscriptions')
    .insert({
      workspace_id,
      url,
      events,
      secret: secret || crypto.randomUUID?.() || `whsec-${Date.now()}`,
      status: 'active',
    })
    .select()
    .single();

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data);
  return addRateLimitHeaders(res, ctx);
}
