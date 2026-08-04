import { NextRequest, NextResponse } from 'next/server';
import { FreshnessEngine } from '@/lib/services/oge/freshnessEngine';
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

    const engine = new FreshnessEngine();
    const opportunities = await engine.getTopFreshnessOpportunities(publicationId);
    const stats = await engine.getFreshnessStats(publicationId);

    return NextResponse.json({
      data: opportunities,
      count: opportunities.length,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting freshness opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to get freshness opportunities' },
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
      url,
      last_update,
      position,
      impressions,
      ctr_trend,
    } = body;

    if (!publication_id || !url) {
      return NextResponse.json(
        { error: 'publication_id and url are required' },
        { status: 400 }
      );
    }

    const engine = new FreshnessEngine();
    await engine.storeContentFreshness({
      publication_id,
      url,
      last_update: last_update ? new Date(last_update) : undefined,
      position: position || 0,
      impressions: impressions || 0,
      ctr_trend: ctr_trend || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Freshness data stored',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing freshness data:', error);
    return NextResponse.json(
      { error: 'Failed to store freshness data' },
      { status: 500 }
    );
  }
}
