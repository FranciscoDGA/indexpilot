import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DataExplorer } from '@/lib/analytics';
import type { AnalyticsQuery } from '@/types/analytics';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const action = searchParams.get('action') || 'list';
    const module = searchParams.get('module');

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const explorer = new DataExplorer();

    if (action === 'columns' && module) {
      const columns = await explorer.getAvailableColumns(module);
      return NextResponse.json({ success: true, data: columns });
    }

    const queries = await explorer.getQueries(tenantId, user.id);
    return NextResponse.json({ success: true, data: queries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, tenant_id } = body;

    const explorer = new DataExplorer();

    if (action === 'execute') {
      const query: AnalyticsQuery = {
        module: body.module,
        date_range: body.date_range,
        tenant_id,
        site_ids: body.site_ids,
        group_by: body.group_by,
        metrics: body.metrics,
        filters: body.filters,
        limit: body.limit,
        offset: body.offset,
      };

      const result = await explorer.executeQuery(query);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'save') {
      if (!tenant_id || !body.name || !body.query_config) {
        return NextResponse.json({ error: 'tenant_id, name, and query_config required' }, { status: 400 });
      }
      const saved = await explorer.saveQuery({
        tenantId: tenant_id,
        userId: user.id,
        name: body.name,
        description: body.description,
        queryConfig: body.query_config,
        columns: body.columns || [],
        filters: body.filters,
        sortConfig: body.sort_config,
        visualizationType: body.visualization_type,
      });
      return NextResponse.json({ success: true, data: saved });
    }

    if (action === 'star') {
      const updated = await explorer.toggleStar(body.query_id);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete') {
      await explorer.deleteQuery(body.query_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}