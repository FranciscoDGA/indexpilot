import { NextRequest, NextResponse } from 'next/server';
import { ConnectorManager, WebhookEngine } from '@/lib/connectors';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient();
    const manager = new ConnectorManager(supabase);
    const webhookEngine = new WebhookEngine(manager);

    const body = await request.json();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = await webhookEngine.processWebhook(id, body, headers);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, event: result.event });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
