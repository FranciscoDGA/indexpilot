import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError, GatewayContext } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const supabase = createClient();
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(sites, { total: sites?.length || 0 });
  return addRateLimitHeaders(res, ctx);
}

export async function POST(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const body = await request.json();
  const { name, domain } = body;

  if (!name || !domain) return apiError('VALIDATION_ERROR', 'name and domain are required');

  const supabase = createClient();
  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      user_id: ctx.userId,
      name,
      domain,
      status: 'active',
    })
    .select()
    .single();

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(site);
  return addRateLimitHeaders(res, ctx);
}
