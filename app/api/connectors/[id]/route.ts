import { NextRequest, NextResponse } from 'next/server';
import { ConnectorManager } from '@/lib/connectors';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    return NextResponse.json({ connector });
  } catch (error) {
    console.error('Error getting connector:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const updated = await manager.updateConnector(id, body);

    return NextResponse.json({ connector: updated });
  } catch (error) {
    console.error('Error updating connector:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await manager.deleteConnector(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connector:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
