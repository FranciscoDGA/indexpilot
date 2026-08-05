import { NextRequest, NextResponse } from 'next/server';
import { GatewayConfig, ApiResponse } from '@/types/platform';
import { RateLimitManager } from '../rateLimit/rateLimitManager';
import { createClient } from '@/lib/supabase/server';

const defaultConfig: GatewayConfig = {
  version: 'v1',
  basePath: '/api/v1',
  rateLimitEnabled: true,
  loggingEnabled: true,
  cacheEnabled: false,
};

const rateLimiter = new RateLimitManager();

export interface GatewayContext {
  clientId?: string;
  userId?: string;
  tier: string;
  scopes: string[];
  rateLimitResult?: {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterMs?: number;
  };
}

/**
 * API Gateway middleware.
 * Handles authentication, rate limiting, logging, and versioning.
 */
export async function gatewayMiddleware(
  request: NextRequest,
  config: Partial<GatewayConfig> = {}
): Promise<{ response?: NextResponse; context?: GatewayContext }> {
  const cfg = { ...defaultConfig, ...config };

  // Extract API version from URL
  const version = extractVersion(request.nextUrl.pathname);

  // Authenticate
  const authResult = await authenticate(request);
  if (authResult.error) {
    return {
      response: NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      ),
    };
  }

  const context: GatewayContext = {
    clientId: authResult.clientId,
    userId: authResult.userId,
    tier: authResult.tier || 'free',
    scopes: authResult.scopes || [],
  };

  // Rate limiting
  if (cfg.rateLimitEnabled && context.clientId) {
    const rateLimitResult = rateLimiter.checkLimit(context.clientId, context.tier as any);
    context.rateLimitResult = rateLimitResult;

    if (!rateLimitResult.allowed) {
      return {
        response: NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests',
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimitResult.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetAt / 1000)),
              'Retry-After': String(Math.ceil((rateLimitResult.retryAfterMs || 60000) / 1000)),
            },
          }
        ),
      };
    }
  }

  return { context };
}

/**
 * Add rate limit headers to response.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  context: GatewayContext
): NextResponse {
  if (context.rateLimitResult) {
    response.headers.set('X-RateLimit-Limit', String(context.rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(context.rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(context.rateLimitResult.resetAt / 1000)));
  }
  response.headers.set('X-API-Version', 'v1');
  return response;
}

/**
 * Create a standardized API response.
 */
export function apiResponse<T>(
  data?: T,
  meta?: Record<string, any>
): NextResponse {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta,
  };
  return NextResponse.json(body);
}

/**
 * Create an error response.
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const body: ApiResponse = {
    success: false,
    error: { code, message, details },
  };
  return NextResponse.json(body, { status });
}

// --- Helpers ---

function extractVersion(pathname: string): string | null {
  const match = pathname.match(/^\/api\/(v\d+|beta)/);
  return match ? match[1] : null;
}

async function authenticate(request: NextRequest): Promise<{
  clientId?: string;
  userId?: string;
  tier?: string;
  scopes?: string[];
  error?: { code: string; message: string };
  status?: number;
}> {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (apiKey) {
    // For now, accept any API key format for demo
    return {
      clientId: 'demo-client',
      userId: 'demo-user',
      tier: 'free',
      scopes: ['read', 'write'],
    };
  }

  // Check for session cookie (web app)
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return {
      userId: session.user.id,
      tier: 'free',
      scopes: ['read', 'write', 'admin'],
    };
  }

  return {
    error: { code: 'UNAUTHORIZED', message: 'API key or session required' },
    status: 401,
  };
}
