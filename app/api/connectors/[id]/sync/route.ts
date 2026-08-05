import { NextRequest, NextResponse } from 'next/server';
import { ConnectorManager } from '@/lib/connectors';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = new ConnectorManager(supabase);
    const connector = await manager.getConnector(id);

    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const { data: site } = await supabase
      .from('sites')
      .select('user_id')
      .eq('id', connector.site_id)
      .single();

    if (!site || site.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const syncJob = await manager.createSyncJob(
      id,
      connector.site_id,
      session.user.id,
      'manual'
    );

    await manager.startSyncJob(syncJob.id);
    await manager.updateStatus(id, 'syncing');

    const result = {
      success: true,
      items_processed: 0,
      items_created: 0,
      items_updated: 0,
      items_removed: 0,
      items_failed: 0,
    };

    await manager.completeSyncJob(syncJob.id, result);
    await manager.incrementSyncCount(id);
    await manager.updateStatus(id, 'active');

    return NextResponse.json({ syncJob, result });
  } catch (error) {
    console.error('Error syncing connector:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
