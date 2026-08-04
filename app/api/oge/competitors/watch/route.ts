import { NextRequest, NextResponse } from 'next/server';
import { CompetitorWatchEngine } from '@/lib/services/oge/competitorWatchEngine';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domain = request.nextUrl.searchParams.get('domain');
    const action = request.nextUrl.searchParams.get('action');

    if (!domain) {
      return NextResponse.json(
        { error: 'domain is required' },
        { status: 400 }
      );
    }

    const engine = new CompetitorWatchEngine();

    if (action === 'metrics') {
      const metrics = await engine.getCompetitorMetrics(domain);
      return NextResponse.json({ data: metrics });
    }

    if (action === 'growth') {
      const growth = await engine.trackCompetitorGrowth(domain);
      return NextResponse.json({ data: growth });
    }

    if (action === 'new_content') {
      const newContent = await engine.getCompetitorNewContent(domain);
      return NextResponse.json({ data: newContent, count: newContent.length });
    }

    if (action === 'strategy') {
      const strategy = await engine.analyzeStrategy(domain);
      return NextResponse.json({ data: strategy });
    }

    if (action === 'alerts') {
      const alerts = await engine.getCompetitorAlerts(domain);
      return NextResponse.json({ data: alerts, count: alerts.length });
    }

    if (action === 'strategy') {
      const strategy = await engine.analyzeStrategy(domain);
      return NextResponse.json({ data: strategy });
    }

    if (action === 'new_content') {
      const newContent = await engine.getCompetitorNewContent(domain);
      return NextResponse.json({ data: newContent, count: newContent.length });
    }

    // Default: return all metrics
    const metrics = await engine.getCompetitorMetrics(domain);
    const growth = await engine.trackCompetitorGrowth(domain);
    const allAlerts = await engine.getCompetitorAlerts(domain);

    return NextResponse.json({
      domain,
      metrics,
      growth,
      alerts: allAlerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting competitor data:', error);
    return NextResponse.json(
      { error: 'Failed to get competitor data' },
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
    const { publication_id, domain, action, competitors } = body;

    if (!publication_id || !domain) {
      return NextResponse.json(
        { error: 'publication_id and domain are required' },
        { status: 400 }
      );
    }

    const engine = new CompetitorWatchEngine();

    if (action === 'add') {
      await engine.addCompetitor(publication_id, domain);
      return NextResponse.json({
        success: true,
        message: 'Competitor added for tracking',
      });
    }

    if (action === 'compare' && competitors) {
      const comparison = await engine.compareCompetitors([domain, ...competitors]);
      return NextResponse.json({ data: comparison });
    }

    if (action === 'market_trend' && competitors) {
      const trend = await engine.analyzeMarketTrend(domain, competitors);
      return NextResponse.json({ data: trend });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing competitor:', error);
    return NextResponse.json(
      { error: 'Failed to manage competitor' },
      { status: 500 }
    );
  }
}
