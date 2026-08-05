import { NextRequest } from 'next/server';
import { gatewayMiddleware, addRateLimitHeaders, apiResponse, apiError } from '@/lib/platform/gateway';

export async function POST(request: NextRequest) {
  const gw = await gatewayMiddleware(request);
  if (gw.response) return gw.response;
  const ctx = gw.context!;

  const body = await request.json();
  const { message, context: aiContext } = body;

  if (!message) return apiError('VALIDATION_ERROR', 'message is required');

  const result = {
    response: `AI response to: ${message}`,
    model: 'indexpilot-ai',
    tokens_used: message.length,
    timestamp: new Date().toISOString(),
  };

  const res = apiResponse(result);
  return addRateLimitHeaders(res, ctx);
}
