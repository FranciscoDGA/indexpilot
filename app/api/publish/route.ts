import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { validatePublishRequest, extractDomain } from '@/lib/api/validation';
import { verifyApiKey, hashApiKey, updateApiKeyLastUsed } from '@/lib/api/apiKey';
import { createPublication, createPublicationLog, createPublicationEvent } from '@/lib/api/publication';
import type { PublishResponse } from '@/types';

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (limit.count >= 100) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse<PublishResponse>> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Authorization header',
          code: 'MISSING_AUTH',
        },
        { status: 401 }
      );
    }

    // Extract API key
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Authorization header format',
          code: 'INVALID_AUTH_FORMAT',
        },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(apiKey)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    // Validate request data
    const validation = validatePublishRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const publishData = validation.data!;
    const domain = extractDomain(publishData.url);

    // Verify API key
    const keyVerification = await verifyApiKey(apiKey, domain);
    if (!keyVerification.valid) {
      await createPublicationLog(
        'unknown',
        `Failed API key verification: ${keyVerification.error}`,
        'error',
        { ip: clientIp }
      );

      return NextResponse.json(
        {
          success: false,
          error: keyVerification.error,
          code: 'INVALID_API_KEY',
        },
        { status: 401 }
      );
    }

    // Create publication
    const publication = await createPublication(
      keyVerification.siteId!,
      publishData,
      clientIp
    );

    if (!publication.success) {
      if (publication.code === 'DUPLICATE_URL') {
        return NextResponse.json(
          {
            success: false,
            error: publication.error,
            code: publication.code,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: publication.error,
          code: publication.code,
        },
        { status: 500 }
      );
    }

    // Update API key last used
    await updateApiKeyLastUsed(hashApiKey(apiKey), clientIp);

    // Log successful publication
    await createPublicationLog(
      publication.publicationId!,
      'Publication accepted successfully',
      'success',
      { ip: clientIp, domain }
    );

    await createPublicationEvent(publication.publicationId!, 'validated', {
      domain,
      ip: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        publicationId: publication.publicationId,
        message: 'Publication received and queued',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Publish endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
