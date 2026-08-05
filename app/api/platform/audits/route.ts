import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const body = await request.json();
  const { site_id, url: targetUrl } = body;

  if (!site_id) return apiError('VALIDATION_ERROR', 'site_id is required');

  const supabase = createClient();

  const auditId = crypto.randomUUID ? crypto.randomUUID() : `audit-${Date.now()}`;

  const result = {
    audit_id: auditId,
    site_id,
    url: targetUrl,
    status: 'running',
    started_at: new Date().toISOString(),
  };

  const res = apiResponse(result);
  return addRateLimitHeaders(res, ctx);
}

export async function GET(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('seo_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return apiError('DB_ERROR', error.message, 500);

  const res = apiResponse(data, { total: data?.length || 0 });
  return addRateLimitHeaders(res, ctx);
}
