import { NextRequest, NextResponse } from 'next/server';
import { StatusResponse } from '@/types/indexPilot';
import { queueEngine } from '@/lib/services/indexPilot';
import { verifyAuth } from '@/lib/supabase/auth';

/**
 * GET /api/v1/status
 * Get overall indexing status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const site = request.nextUrl.searchParams.get('site');
    if (!site) {
      return NextResponse.json(
        { error: 'site parameter is required' },
        { status: 400 }
      );
    }

    const stats = await queueEngine.getQueueStats();
    const siteQueue = await queueEngine.getSiteQueue(site);

    const response: StatusResponse = {
      site,
      totalUrls: siteQueue.length,
      pending: siteQueue.filter((j) => j.status === 'pending').length,
      queued: siteQueue.filter((j) => j.status === 'queued').length,
      processing: siteQueue.filter((j) => j.status === 'processing').length,
      indexed: siteQueue.filter((j) => j.status === 'completed').length,
      failed: siteQueue.filter((j) => j.status === 'failed').length,
      averageProcessingTime: 0, // Would calculate from logs
      lastSync: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in /api/v1/status:', err);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
