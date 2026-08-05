import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const url = new URL(request.url);
  const siteId = url.searchParams.get('site_id');
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const supabase = createClient();

  let query = supabase
    .from('publication_queue')
    .select('*', { count: 'exact' })
    .eq('site_id', siteId || '')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data, {
    page,
    limit,
    total: count || 0,
    hasMore: (count || 0) > page * limit,
  });
  return addRateLimitHeaders(res, ctx);
}

export async function POST(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const body = await request.json();
  const { site_id, url: contentUrl, title, type } = body;

  if (!site_id || !contentUrl) {
    return apiError('VALIDATION_ERROR', 'site_id and url are required');
  }

  const supabase = createClient();

  const slug = contentUrl.split('/').pop() || contentUrl;
  const { data, error } = await supabase
    .from('publication_queue')
    .insert({
      site_id,
      url: contentUrl,
      title: title || contentUrl,
      slug,
      type: type || 'other',
      status: 'RECEIVED',
      priority: 5,
    })
    .select()
    .single();

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data);
  return addRateLimitHeaders(res, ctx);
}
