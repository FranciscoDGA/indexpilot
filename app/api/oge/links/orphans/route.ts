import { NextRequest, NextResponse } from 'next/server';
import { InternalLinkingEngine } from '@/lib/services/oge/internalLinkingEngine';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicationId = request.nextUrl.searchParams.get('publication_id');
    if (!publicationId) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const engine = new InternalLinkingEngine();
    const orphans = await engine.detectOrphanPages(publicationId);

    const meshData = await engine.getLinkMeshData(publicationId);

    return NextResponse.json({
      data: orphans,
      count: orphans.length,
      mesh: meshData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error detecting orphan pages:', error);
    return NextResponse.json(
      { error: 'Failed to detect orphan pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publication_id, url, inbound_links, traffic, potential_traffic } = body;

    if (!publication_id || !url) {
      return NextResponse.json(
        { error: 'publication_id and url are required' },
        { status: 400 }
      );
    }

    const engine = new InternalLinkingEngine();

    // Record the orphan page
    await engine.recordInternalLink(publication_id, '', url, '', 'generic', false);

    return NextResponse.json({
      success: true,
      message: 'Orphan page recorded',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording orphan page:', error);
    return NextResponse.json(
      { error: 'Failed to record orphan page' },
      { status: 500 }
    );
  }
}
