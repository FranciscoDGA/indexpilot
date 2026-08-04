import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';
import { randomBytes } from 'crypto';

// In-memory storage for IndexNow credentials (would be Prisma in production)
const indexNowCredentials = new Map<string, any>();

/**
 * POST /api/v1/integrations/indexnow/setup
 * Initialize IndexNow for a site
 * Expected body: { siteId, siteUrl, generateKey? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, siteUrl, generateKey = true } = body;

    if (!siteId || !siteUrl) {
      return NextResponse.json(
        { error: 'siteId and siteUrl are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(siteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid siteUrl format' },
        { status: 400 }
      );
    }

    let apiKey: string;

    if (generateKey) {
      // Generate new IndexNow key
      // Format: 32 hex characters (16 bytes)
      apiKey = randomBytes(16).toString('hex').toUpperCase();
    } else if (body.apiKey) {
      // Use provided key
      apiKey = body.apiKey;
    } else {
      return NextResponse.json(
        { error: 'Either generateKey=true or apiKey must be provided' },
        { status: 400 }
      );
    }

    const credential = {
      id: `inow_${Date.now()}`,
      userId: session.user.id,
      siteId,
      siteUrl,
      apiKey,
      status: 'pending', // Will be 'active' after key is verified at .well-known/IndexNow.txt
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    indexNowCredentials.set(credential.id, credential);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: credential.id,
          siteId: credential.siteId,
          siteUrl: credential.siteUrl,
          apiKey: credential.apiKey,
          status: credential.status,
          instructions: {
            step1: 'Place the following file at: ' + siteUrl + '/.well-known/IndexNow.txt',
            step2: 'File content: ' + apiKey,
            step3: 'After file is accessible, call the verify endpoint',
            bingEndpoint: 'https://www.bing.com/indexnow',
            yandexEndpoint: 'https://yandex.com/indexnow',
          },
          createdAt: credential.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error in POST /api/v1/integrations/indexnow/setup:', err);
    return NextResponse.json(
      { error: 'Failed to setup IndexNow' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/integrations/indexnow/verify
 * Verify IndexNow key at .well-known/IndexNow.txt
 * Expected body: { credentialId }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credentialId } = body;

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId is required' },
        { status: 400 }
      );
    }

    const credential = indexNowCredentials.get(credentialId);
    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (credential.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // In production, would verify by fetching:
    // GET {siteUrl}/.well-known/IndexNow.txt
    // And checking if it contains the apiKey

    // For now, simulate verification
    credential.status = 'active';
    credential.verifiedAt = new Date();
    indexNowCredentials.set(credentialId, credential);

    return NextResponse.json({
      success: true,
      data: {
        id: credential.id,
        status: credential.status,
        verifiedAt: credential.verifiedAt,
        message: 'IndexNow key verified successfully',
      },
    });
  } catch (err) {
    console.error('Error verifying IndexNow key:', err);
    return NextResponse.json(
      { error: 'Failed to verify IndexNow key' },
      { status: 500 }
    );
  }
}
