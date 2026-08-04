import { NextRequest, NextResponse } from 'next/server';
import { DiscoverReadinessEngine } from '@/lib/services/oge/discoverReadinessEngine';
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

    const engine = new DiscoverReadinessEngine();
    const checks = await engine.auditDiscoverReadiness(publicationId);
    const potential = await engine.getDiscoverPotential(publicationId);

    return NextResponse.json({
      data: checks,
      count: checks.length,
      potential,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error auditing Discover readiness:', error);
    return NextResponse.json(
      { error: 'Failed to audit Discover readiness' },
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
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    const engine = new DiscoverReadinessEngine();
    const check = await engine.checkPageReadiness(url);

    return NextResponse.json({
      data: check,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking page readiness:', error);
    return NextResponse.json(
      { error: 'Failed to check page readiness' },
      { status: 500 }
    );
  }
}
