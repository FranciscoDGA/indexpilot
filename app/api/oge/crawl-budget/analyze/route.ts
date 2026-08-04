import { NextRequest, NextResponse } from 'next/server';
import { CrawlBudgetAnalyzer } from '@/lib/services/oge/crawlBudgetAnalyzer';
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

    const engine = new CrawlBudgetAnalyzer();
    const analysis = await engine.analyzeCrawlWaste(publicationId);
    const stats = await engine.getStatistics(publicationId);
    const impact = engine.estimateImpact(analysis);
    const priorityFixes = engine.getPriorityFixes(analysis);

    return NextResponse.json({
      data: analysis,
      stats,
      impact,
      priority_fixes: priorityFixes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing crawl budget:', error);
    return NextResponse.json(
      { error: 'Failed to analyze crawl budget' },
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
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      );
    }

    const engine = new CrawlBudgetAnalyzer();
    const checklist = engine.getImplementationChecklist(
      category as 'not_found' | 'soft_404' | 'redirect' | 'duplicate'
    );

    return NextResponse.json({
      category,
      checklist,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting implementation checklist:', error);
    return NextResponse.json(
      { error: 'Failed to get checklist' },
      { status: 500 }
    );
  }
}
