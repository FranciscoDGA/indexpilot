import { NextRequest, NextResponse } from 'next/server';
import { ConnectorManager } from '@/lib/connectors';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/connectors/list
 * List all connectors for the authenticated user's sites.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .eq('user_id', session.user.id);

    if (!sites || sites.length === 0) {
      return NextResponse.json({ connectors: [] });
    }

    const manager = new ConnectorManager(supabase);
    const allConnectors = [];

    for (const site of sites) {
      const connectors = await manager.listConnectors(site.id);
      allConnectors.push(...connectors);
    }

    return NextResponse.json({ connectors: allConnectors });
  } catch (error) {
    console.error('Error listing connectors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
