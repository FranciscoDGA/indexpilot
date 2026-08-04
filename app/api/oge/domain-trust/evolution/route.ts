import { NextRequest, NextResponse } from 'next/server';
import { DomainTrustEvolutionEngine } from '@/lib/services/oge/domainTrustEvolutionEngine';
import { verifyAuth } from '@/lib/supabase/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicationId = request.nextUrl.searchParams.get('publication_id');
    const weeks = parseInt(request.nextUrl.searchParams.get('weeks') || '12');

    if (!publicationId) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const engine = new DomainTrustEvolutionEngine();

    // Get current trust score
    const currentTrust = await engine.calculateTrustScore(publicationId);

    // Get evolution over time
    const evolution = await engine.getTrustEvolution(publicationId, weeks);

    // Get recommendations
    const recommendations = await engine.getTrustRecommendations(currentTrust);

    return NextResponse.json({
      current: currentTrust,
      evolution,
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error calculating domain trust:', error);
    return NextResponse.json(
      { error: 'Failed to calculate domain trust' },
      { status: 500 }
    );
  }
}
