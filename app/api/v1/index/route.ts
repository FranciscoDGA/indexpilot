import { NextRequest, NextResponse } from 'next/server';
import { IndexRequest, IndexResponse } from '@/types/indexPilot';
import { validationEngine, priorityEngine, queueEngine, loggerService } from '@/lib/services/indexPilot';
import { verifyAuth } from '@/lib/supabase/auth';

/**
 * POST /api/v1/index
 * Main endpoint to submit URLs for indexing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: IndexRequest = await request.json();
    const { site, url, type = 'article' } = body;

    // Validate input
    if (!site || !url) {
      return NextResponse.json(
        { error: 'site and url are required' },
        { status: 400 }
      );
    }

    // Log reception
    await loggerService.logIndexReceived(session.user.id, site, url, type);

    // Validate URL
    const validation = await validationEngine.validateUrl(url);

    if (!validation.passed) {
      await loggerService.logValidation(
        session.user.id,
        site,
        '',
        false,
        validation.errors
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          validation,
        },
        { status: 400 }
      );
    }

    await loggerService.logValidation(session.user.id, site, '', true);

    // Calculate priority
    const priority = priorityEngine.calculatePriority(
      type,
      true, // isNew (would check DB in production)
      false, // isUpdated
      type === 'page' // isLandingPage
    );

    // Enqueue URL
    const job = await queueEngine.enqueueUrl(site + '_' + url, priority, {
      type,
      site,
      url,
    });

    await loggerService.logQueued(session.user.id, site, job.id, priority);

    const response: IndexResponse = {
      success: true,
      urlId: job.id,
      status: 'queued',
      priority,
      queuePosition: 1, // Would calculate from queue in production
      message: 'URL queued for indexing',
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error in /api/v1/index:', err);
    return NextResponse.json(
      { error: 'Failed to process indexing request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/index
 * Get indexing statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await queueEngine.getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in /api/v1/index GET:', err);
    return NextResponse.json(
      { error: 'Failed to fetch indexing stats' },
      { status: 500 }
    );
  }
}
