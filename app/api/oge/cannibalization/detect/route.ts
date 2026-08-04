import { NextRequest, NextResponse } from 'next/server';
import { CannibalizationEngine } from '@/lib/services/oge/cannibalizationEngine';
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

    const engine = new CannibalizationEngine();
    const cannibalizations = await engine.detectCannibalization(publicationId);
    const stats = await engine.getStats(publicationId);
    const impact = engine.calculateCanonicalImpact(cannibalizations);

    return NextResponse.json({
      data: cannibalizations,
      count: cannibalizations.length,
      stats,
      impact,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error detecting cannibalization:', error);
    return NextResponse.json(
      { error: 'Failed to detect cannibalization' },
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
    const { publication_id, keyword, action, status } = body;

    if (!publication_id || !keyword || !action) {
      return NextResponse.json(
        { error: 'publication_id, keyword, and action are required' },
        { status: 400 }
      );
    }

    const engine = new CannibalizationEngine();
    await engine.trackResolution(publication_id, keyword, action, status || 'pending');

    return NextResponse.json({
      success: true,
      message: 'Cannibalization resolution tracked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking cannibalization resolution:', error);
    return NextResponse.json(
      { error: 'Failed to track resolution' },
      { status: 500 }
    );
  }
}
