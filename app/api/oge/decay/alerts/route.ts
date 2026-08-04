import { NextRequest, NextResponse } from 'next/server';
import { ContentDecayEngine } from '@/lib/services/oge/contentDecayEngine';
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

    const engine = new ContentDecayEngine();
    const alerts = await engine.getCriticalDecayAlerts(publicationId);
    const stats = await engine.getDecayStats(publicationId);

    return NextResponse.json({
      data: alerts,
      count: alerts.length,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting decay alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get decay alerts' },
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
      metric_type,
      value_90d_ago,
      value_30d_ago,
      value_today,
      ctr_trend,
      position_trend,
    } = body;

    if (!publication_id || !url || !metric_type || value_today === undefined) {
      return NextResponse.json(
        {
          error:
            'publication_id, url, metric_type, and value_today are required',
        },
        { status: 400 }
      );
    }

    const engine = new ContentDecayEngine();
    await engine.storeDecayAnalysis({
      publication_id,
      url,
      metric_type,
      value_90d_ago,
      value_30d_ago,
      value_today,
      ctr_trend,
      position_trend,
    });

    return NextResponse.json({
      success: true,
      message: 'Decay analysis stored',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing decay analysis:', error);
    return NextResponse.json(
      { error: 'Failed to store decay analysis' },
      { status: 500 }
    );
  }
}
