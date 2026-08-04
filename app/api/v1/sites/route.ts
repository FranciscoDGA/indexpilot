import { NextRequest, NextResponse } from 'next/server';
import { Site, SitesResponse } from '@/types/indexPilot';
import { verifyAuth } from '@/lib/supabase/auth';
import { crypto } from 'node:crypto';

// In-memory storage for sites (would be Prisma in production)
const sites = new Map<string, Site & { userId: string }>();

/**
 * POST /api/v1/sites
 * Create a new site
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, domain } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'name and domain are required' },
        { status: 400 }
      );
    }

    // Validate domain format
    try {
      new URL(`https://${domain}`);
    } catch {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check for duplicates per user
    const userSites = Array.from(sites.values()).filter(
      (s) => s.userId === session.user.id && s.domain === domain
    );
    if (userSites.length > 0) {
      return NextResponse.json(
        { error: 'Site with this domain already exists' },
        { status: 409 }
      );
    }

    const site: Site & { userId: string } = {
      id: `site_${crypto.randomUUID()}`,
      name,
      domain,
      status: 'active',
      ownerId: session.user.id,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sites.set(site.id, site);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: site.id,
          name: site.name,
          domain: site.domain,
          status: site.status,
          createdAt: site.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error in POST /api/v1/sites:', err);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/sites
 * List all sites for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSites = Array.from(sites.values())
      .filter((s) => s.userId === session.user.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        domain: s.domain,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

    const response: SitesResponse = {
      sites: userSites,
      total: userSites.length,
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in GET /api/v1/sites:', err);
    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}
