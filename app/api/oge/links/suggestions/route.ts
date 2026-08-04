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
    const url = request.nextUrl.searchParams.get('url');

    if (!publicationId || !url) {
      return NextResponse.json(
        { error: 'publication_id and url are required' },
        { status: 400 }
      );
    }

    const engine = new InternalLinkingEngine();
    const suggestions = await engine.suggestLinksForOrphanPage(publicationId, url);

    return NextResponse.json({
      data: suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting link suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get link suggestions' },
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
    const {
      publication_id,
      source_url,
      target_url,
      link_text,
      anchor_type,
    } = body;

    if (!publication_id || !source_url || !target_url) {
      return NextResponse.json(
        {
          error:
            'publication_id, source_url, and target_url are required',
        },
        { status: 400 }
      );
    }

    const engine = new InternalLinkingEngine();
    await engine.recordInternalLink(
      publication_id,
      source_url,
      target_url,
      link_text,
      anchor_type || 'generic',
      false
    );

    return NextResponse.json({
      success: true,
      message: 'Link recorded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording link:', error);
    return NextResponse.json(
      { error: 'Failed to record link' },
      { status: 500 }
    );
  }
}
