import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';

// In-memory storage (would be Prisma in production)
const googleAccounts = new Map<string, any>();
const gscProperties = new Map<string, any>();

/**
 * GET /api/v1/integrations/google/properties
 * List all Google Search Console properties for user's accounts
 * Query params: accountId (optional - filter by specific account)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = request.nextUrl.searchParams.get('accountId');

    // Get user's Google accounts
    let userAccounts = Array.from(googleAccounts.values()).filter(
      (a) => a.userId === session.user.id
    );

    if (accountId) {
      userAccounts = userAccounts.filter((a) => a.id === accountId);
      if (userAccounts.length === 0) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }
    }

    // Get properties for these accounts
    const properties = Array.from(gscProperties.values())
      .filter((p) => userAccounts.some((a) => a.id === p.googleAccountId))
      .map((p) => ({
        id: p.id,
        accountId: p.googleAccountId,
        siteUrl: p.siteUrl,
        propertyType: p.propertyType,
        status: p.status,
        isPrimary: p.isPrimary,
        lastSyncedAt: p.lastSyncedAt,
        createdAt: p.createdAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        properties,
        total: properties.length,
        accounts: userAccounts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in GET /api/v1/integrations/google/properties:', err);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/integrations/google/properties
 * Sync properties from Google Search Console
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

    // In production, would call Google Search Console API to fetch properties
    // GET https://www.googleapis.com/webmasters/v3/sites
    // Returns list of verified properties

    // For now, return mock properties
    const mockProperties = [
      {
        id: `gscprop_${Date.now()}`,
        googleAccountId: accountId,
        siteUrl: 'https://example.com/',
        propertyType: 'domain',
        status: 'verified',
        isPrimary: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
      },
    ];

    mockProperties.forEach((p) => gscProperties.set(p.id, p));

    return NextResponse.json(
      {
        success: true,
        data: {
          propertiesSynced: mockProperties.length,
          properties: mockProperties.map((p) => ({
            id: p.id,
            siteUrl: p.siteUrl,
            propertyType: p.propertyType,
            status: p.status,
          })),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error syncing Google properties:', err);
    return NextResponse.json(
      { error: 'Failed to sync properties' },
      { status: 500 }
    );
  }
}
