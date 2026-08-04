import { NextRequest, NextResponse } from 'next/server';
import { SERPIntelligenceEngine } from '@/lib/services/oge/serpIntelligenceEngine';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicationId = request.nextUrl.searchParams.get('publication_id');
    const action = request.nextUrl.searchParams.get('action');
    const timeframe = request.nextUrl.searchParams.get('timeframe') as '1_week' | '1_month' | '3_months' || '1_month';

    if (!publicationId && !action) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const engine = new SERPIntelligenceEngine();

    if (action === 'snippets') {
      const opportunities = await engine.getSnippetOpportunities(publicationId || '');
      return NextResponse.json({
        data: opportunities,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'winners') {
      const winners = await engine.trackSERPWinners(timeframe);
      return NextResponse.json({
        data: winners,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'ai_overview') {
      const analysis = await engine.analyzeAIOverviewImpact();
      return NextResponse.json({
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    }

    // Default: analyze keyword
    const keyword = request.nextUrl.searchParams.get('keyword');
    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword or action is required' },
        { status: 400 }
      );
    }

    const serp = await engine.analyzeSERP(keyword);
    const aiOverviewImpact = await engine.analyzeAIOverviewImpact();

    return NextResponse.json({
      data: serp,
      ai_overview_impact: aiOverviewImpact,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing SERP:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SERP' },
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
    const { keywords, include_ai_analysis, publication_id, keyword, action } = body;

    const engine = new SERPIntelligenceEngine();

    // Single keyword analysis
    if (action === 'analyze' && keyword) {
      const result = await engine.analyzeSERP(keyword);
      return NextResponse.json({
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    // Batch keyword analysis
    if (keywords && Array.isArray(keywords)) {
      const results = await Promise.all(
        keywords.map((kw: string) => engine.analyzeSERP(kw))
      );

      return NextResponse.json({
        data: results,
        count: results.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'keywords array or keyword + action required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error batch analyzing SERP:', error);
    return NextResponse.json(
      { error: 'Failed to batch analyze SERP' },
      { status: 500 }
    );
  }
}
