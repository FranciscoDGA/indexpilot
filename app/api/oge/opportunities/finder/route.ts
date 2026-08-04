import { NextRequest, NextResponse } from 'next/server';
import { ContentOpportunityFinder } from '@/lib/services/oge/contentOpportunityFinder';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicationId = request.nextUrl.searchParams.get('publication_id');
    const action = request.nextUrl.searchParams.get('action');
    const type = request.nextUrl.searchParams.get('type');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    if (!publicationId) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const engine = new ContentOpportunityFinder();

    if (action === 'all') {
      const all = await engine.findAllOpportunities(publicationId);
      return NextResponse.json({
        data: all,
        count: all.length,
      });
    }

    if (action === 'gaps') {
      const gaps = await engine.analyzeContentGaps(publicationId);
      return NextResponse.json({
        data: gaps,
      });
    }

    if (action === 'calendar') {
      const calendar = await engine.generateContentCalendar(publicationId, 3);
      return NextResponse.json({
        data: calendar,
      });
    }

    if (type === 'high_impression') {
      const opportunities = await engine.findHighImpressionGaps(publicationId);
      return NextResponse.json({
        data: opportunities,
        count: opportunities.length,
      });
    }

    if (type === 'ranking_gaps') {
      const opportunities = await engine.findRankingGaps(publicationId);
      return NextResponse.json({
        data: opportunities,
        count: opportunities.length,
      });
    }

    if (type === 'prioritized') {
      const opportunities = await engine.getPrioritizedOpportunities(
        publicationId,
        limit
      );
      return NextResponse.json({
        data: opportunities,
        count: opportunities.length,
      });
    }

    // Default: all opportunities
    const all = await engine.findAllOpportunities(publicationId);
    const gaps = await engine.analyzeContentGaps(publicationId);

    return NextResponse.json({
      data: all.slice(0, limit),
      count: all.length,
      analysis: gaps,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error finding content opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to find opportunities' },
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
    const { publication_id, keyword, action, months_ahead } = body;

    if (!publication_id) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const engine = new ContentOpportunityFinder();

    if (action === 'brief' && keyword) {
      const brief = await engine.getContentBrief(keyword, 5);
      return NextResponse.json({ data: brief });
    }

    if (action === 'calendar') {
      const calendar = await engine.generateContentCalendar(
        publication_id,
        months_ahead || 3
      );
      return NextResponse.json({ data: calendar });
    }

    if (action === 'analyze') {
      const analysis = await engine.analyzeContentGaps(publication_id);
      return NextResponse.json({ data: analysis });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing opportunity request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
