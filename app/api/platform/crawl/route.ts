import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const body = await request.json();
  const { site_id, urls } = body;

  if (!site_id) return apiError('VALIDATION_ERROR', 'site_id is required');

  const supabase = createClient();

  // Get site
  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', site_id)
    .eq('user_id', ctx.userId)
    .single();

  if (!site) return apiError('NOT_FOUND', 'Site not found', 404);

  // Create crawl job
  const jobId = crypto.randomUUID ? crypto.randomUUID() : `crawl-${Date.now()}`;

  const result = {
    job_id: jobId,
    site_id,
    site_domain: site.domain,
    status: 'started',
    urls_to_crawl: urls?.length || 0,
    started_at: new Date().toISOString(),
  };

  const res = apiResponse(result);
  return addRateLimitHeaders(res, ctx);
}

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const url = new URL(request.url);
  const jobId = url.searchParams.get('job_id');

  if (!jobId) return apiError('VALIDATION_ERROR', 'job_id is required');

  const result = {
    job_id: jobId,
    status: 'completed',
    urls_found: 0,
    urls_crawled: 0,
    completed_at: new Date().toISOString(),
  };

  const res = apiResponse(result);
  return addRateLimitHeaders(res, ctx);
}
