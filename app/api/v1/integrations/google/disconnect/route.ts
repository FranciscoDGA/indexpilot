import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';

// In-memory storage (would be Prisma in production)
const googleAccounts = new Map<string, any>();

/**
 * POST /api/v1/integrations/google/disconnect
 * Disconnect Google account
 * Expected body: { accountId }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const account = googleAccounts.get(accountId);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (account.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Revoke token with Google (would call https://oauth2.googleapis.com/revoke in production)
    googleAccounts.delete(accountId);

    return NextResponse.json({
      success: true,
      message: 'Google account disconnected successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in POST /api/v1/integrations/google/disconnect:', err);
    return NextResponse.json(
      { error: 'Failed to disconnect Google account' },
      { status: 500 }
    );
  }
}
