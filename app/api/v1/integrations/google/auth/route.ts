import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';

// In-memory storage for Google accounts (would be Prisma in production)
const googleAccounts = new Map<string, any>();

/**
 * POST /api/v1/integrations/google/auth
 * Handle OAuth callback from Google
 * Expected body: { code, state?, credentialType? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, state, credentialType = 'oauth' } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    if (credentialType === 'oauth') {
      // Exchange authorization code for tokens
      // In production, this would call Google's token endpoint:
      // POST https://oauth2.googleapis.com/token
      // With: code, client_id, client_secret, redirect_uri, grant_type=authorization_code

      const googleAccount = {
        id: `gacct_${Date.now()}`,
        userId: session.user.id,
        email: 'user@example.com', // Would extract from token
        projectId: undefined,
        clientId: undefined,
        credentialType: 'oauth',
        status: 'active',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      googleAccounts.set(googleAccount.id, googleAccount);

      return NextResponse.json(
        {
          success: true,
          data: {
            id: googleAccount.id,
            email: googleAccount.email,
            credentialType: googleAccount.credentialType,
            status: googleAccount.status,
            createdAt: googleAccount.createdAt,
          },
        },
        { status: 201 }
      );
    } else if (credentialType === 'service_account') {
      // Service account credential provided directly
      const googleAccount = {
        id: `gacct_${Date.now()}`,
        userId: session.user.id,
        email: body.serviceAccountEmail,
        projectId: body.projectId,
        clientId: body.clientId,
        credentialType: 'service_account',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      googleAccounts.set(googleAccount.id, googleAccount);

      return NextResponse.json(
        {
          success: true,
          data: {
            id: googleAccount.id,
            email: googleAccount.email,
            projectId: googleAccount.projectId,
            credentialType: googleAccount.credentialType,
            status: googleAccount.status,
            createdAt: googleAccount.createdAt,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid credential type' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Error in POST /api/v1/integrations/google/auth:', err);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
