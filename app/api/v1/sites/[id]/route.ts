import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';

// In-memory storage (would be Prisma in production)
const sites = new Map<string, any>();

/**
 * GET /api/v1/sites/{id}
 * Get site details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const site = sites.get(id);
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Verify ownership
    if (site.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: site.id,
        name: site.name,
        domain: site.domain,
        status: site.status,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Error in GET /api/v1/sites/{id}:`, err);
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/sites/{id}
 * Delete a site
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const site = sites.get(id);
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Verify ownership
    if (site.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    sites.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Site deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`Error in DELETE /api/v1/sites/{id}:`, err);
    return NextResponse.json(
      { error: 'Failed to delete site' },
      { status: 500 }
    );
  }
}
