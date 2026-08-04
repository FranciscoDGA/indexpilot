import { NextRequest, NextResponse } from 'next/server';
import { CTROptimizationEngine } from '@/lib/services/oge/ctrOptimizationEngine';
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

    const engine = new CTROptimizationEngine();
    const gaps = await engine.analyzeCTRGaps(publicationId);

    return NextResponse.json({
      data: gaps,
      count: gaps.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing CTR gaps:', error);
    return NextResponse.json(
      { error: 'Failed to analyze CTR gaps' },
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
    const { publication_id, keyword, position, impressions, clicks, ctr } = body;

    if (!publication_id || !keyword) {
      return NextResponse.json(
        { error: 'publication_id and keyword are required' },
        { status: 400 }
      );
    }

    const engine = new CTROptimizationEngine();
    await engine.storeCTRAnalysis({
      publication_id,
      keyword,
      position: position || 0,
      impressions: impressions || 0,
      clicks: clicks || 0,
      ctr: ctr || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'CTR analysis stored',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error storing CTR analysis:', error);
    return NextResponse.json(
      { error: 'Failed to store CTR analysis' },
      { status: 500 }
    );
  }
}
