import { NextRequest, NextResponse } from 'next/server';
import { LogsResponse } from '@/types/indexPilot';
import { loggerService } from '@/lib/services/indexPilot';
import { verifyAuth } from '@/lib/supabase/auth';

/**
 * GET /api/v1/logs
 * Get logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const site = request.nextUrl.searchParams.get('site');
    const action = request.nextUrl.searchParams.get('action');
    const provider = request.nextUrl.searchParams.get('provider');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    const { logs, total } = await loggerService.getLogs({
      userId: session.user.id,
      siteId: site || undefined,
      action: action || undefined,
      provider: provider || undefined,
      limit,
      offset,
    });

    const response: LogsResponse = {
      logs,
      total,
      page: Math.floor(offset / limit),
      pageSize: limit,
    };

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in /api/v1/logs:', err);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
