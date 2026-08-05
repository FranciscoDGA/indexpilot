import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const url = new URL(request.url);
  const subscriptionId = url.searchParams.get('subscription_id');
  const status = url.searchParams.get('status');

  const supabase = createClient();
  let query = supabase
    .from('webhook_deliveries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (subscriptionId) query = query.eq('subscription_id', subscriptionId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data, { total: data?.length || 0 });
  return addRateLimitHeaders(res, ctx);
}
