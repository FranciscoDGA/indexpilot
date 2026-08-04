import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';

/**
 * Authentication middleware for API endpoints
 * Extracts and validates JWT token or API key
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
      return NextResponse.json(
        { error: 'Invalid authorization scheme' },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Verify token
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Call the actual handler
    return await handler(request);
  } catch (err) {
    console.error('Authentication error:', err);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting middleware
 * Track API usage per user/IP
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function withRateLimit(limit: number = 100, windowMs: number = 60000) {
  return (request: NextRequest, handler: () => Promise<NextResponse>) => {
    const key = request.headers.get('authorization') || request.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      requestCounts.set(key, record);
    }

    if (record.count >= limit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetAt - now) / 1000).toString(),
          },
        }
      );
    }

    record.count++;

    return handler();
  };
}

/**
 * CORS middleware
 */
export function withCors(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  return response;
}

/**
 * Error handling middleware
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    console.error('Error:', err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
