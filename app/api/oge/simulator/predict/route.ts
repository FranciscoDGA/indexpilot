import { NextRequest, NextResponse } from 'next/server';
import { GrowthSimulator } from '@/lib/services/oge/growthSimulator';
import { verifyAuth } from '@/lib/supabase/auth';

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
      changes,
      action,
      actual_impressions,
      actual_clicks,
    } = body;

    if (!publication_id || !url) {
      return NextResponse.json(
        { error: 'publication_id and url are required' },
        { status: 400 }
      );
    }

    const simulator = new GrowthSimulator();

    if (action === 'predict') {
      if (!changes) {
        return NextResponse.json(
          { error: 'changes object is required for prediction' },
          { status: 400 }
        );
      }

      const result = await simulator.simulateUpdate(publication_id, {
        url,
        changes,
      });

      return NextResponse.json({
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'track_actual') {
      if (actual_impressions === undefined || actual_clicks === undefined) {
        return NextResponse.json(
          {
            error:
              'actual_impressions and actual_clicks are required for tracking',
          },
          { status: 400 }
        );
      }

      const result = await simulator.trackActualResults(
        publication_id,
        url,
        actual_impressions,
        actual_clicks
      );

      return NextResponse.json({
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'accuracy') {
      const accuracy = await simulator.getPredictionAccuracy(publication_id);

      return NextResponse.json({
        data: accuracy,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in growth simulator:', error);
    return NextResponse.json(
      { error: 'Failed to process simulator request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicationId = request.nextUrl.searchParams.get('publication_id');
    const action = request.nextUrl.searchParams.get('action');

    if (!publicationId) {
      return NextResponse.json(
        { error: 'publication_id is required' },
        { status: 400 }
      );
    }

    const simulator = new GrowthSimulator();

    if (action === 'accuracy') {
      const accuracy = await simulator.getPredictionAccuracy(publicationId);
      return NextResponse.json({
        data: accuracy,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Valid action: accuracy' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching simulator data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulator data' },
      { status: 500 }
    );
  }
}
