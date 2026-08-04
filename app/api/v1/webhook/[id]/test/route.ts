import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/supabase/auth';

// In-memory storage (would be Prisma in production)
const webhooks = new Map<string, any>();

/**
 * POST /api/v1/webhook/{id}/test
 * Test webhook by sending sample payload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhook = webhooks.get(params.id);
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (webhook.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Send test payload (would actually make HTTP request to webhook URL in production)
    const testPayload = {
      webhookId: webhook.id,
      url: 'https://example.com/test-article',
      type: 'article',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Test payload sent',
      data: {
        webhookId: webhook.id,
        testUrl: testPayload.url,
        timestamp: testPayload.timestamp,
      },
    });
  } catch (err) {
    console.error(`Error testing webhook {id}:`, err);
    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
