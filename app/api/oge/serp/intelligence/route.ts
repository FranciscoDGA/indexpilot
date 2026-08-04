import { NextRequest, NextResponse } from 'next/server';
import { SERPIntelligenceEngine } from '@/lib/services/oge/serpIntelligenceEngine';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyword = request.nextUrl.searchParams.get('keyword');
    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword is required' },
        { status: 400 }
      );
    }

    const engine = new SERPIntelligenceEngine();
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
    const { keywords, include_ai_analysis } = body;

    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'keywords array is required' },
        { status: 400 }
      );
    }

    const engine = new SERPIntelligenceEngine();
    const results = await Promise.all(
      keywords.map((kw: string) => engine.analyzeSERP(kw))
    );

    return NextResponse.json({
      data: results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error batch analyzing SERP:', error);
    return NextResponse.json(
      { error: 'Failed to batch analyze SERP' },
      { status: 500 }
    );
  }
}
