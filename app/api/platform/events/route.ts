import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('platform_events')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data, { total: data?.length || 0 });
  return addRateLimitHeaders(res, ctx);
}
