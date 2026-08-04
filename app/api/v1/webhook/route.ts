import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { loggerService, queueEngine, priorityEngine, validationEngine } from '@/lib/services/indexPilot';
import { verifyAuth } from '@/lib/supabase/auth';

// In-memory storage for webhooks (would be Prisma in production)
const webhooks = new Map<string, any>();

/**
 * POST /api/v1/webhook
 * Create a new webhook for a site
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    // Generate webhook secret
    const secret = createHmac('sha256', session.user.id)
      .update(`webhook_${siteId}_${Date.now()}`)
      .digest('hex');

    const webhook = {
      id: `webhook_${Date.now()}`,
      siteId,
      userId: session.user.id,
      secret,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    webhooks.set(webhook.id, webhook);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: webhook.id,
          siteId: webhook.siteId,
          secret: webhook.secret,
          active: webhook.active,
          createdAt: webhook.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error in POST /api/v1/webhook:', err);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/webhook/receive
 * Receive URL submissions from webhook
 * Expected body: { url, type?, contentHash? }
 * Expected header: X-Webhook-Secret (HMAC signature)
 */
export async function PUT(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Webhook-Signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { webhookId, url, type = 'article', contentHash } = body;

    if (!webhookId || !url) {
      return NextResponse.json(
        { error: 'webhookId and url are required' },
        { status: 400 }
      );
    }

    const webhook = webhooks.get(webhookId);
    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', webhook.secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!webhook.active) {
      return NextResponse.json(
        { error: 'Webhook is disabled' },
        { status: 403 }
      );
    }

    // Validate URL
    const validation = await validationEngine.validateUrl(url);
    if (!validation.passed) {
      await loggerService.logValidation(
        webhook.userId,
        webhook.siteId,
        '',
        false,
        validation.errors
      );
      return NextResponse.json(
        {
          success: false,
          message: 'URL validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Calculate priority
    const priority = priorityEngine.calculatePriority(type, true, false, false);

    // Enqueue URL
    const job = await queueEngine.enqueueUrl(
      `${webhook.siteId}_${url}`,
      priority,
      {
        type,
        siteId: webhook.siteId,
        url,
        webhookId,
        contentHash,
      }
    );

    await loggerService.logQueued(webhook.userId, webhook.siteId, job.id, priority);

    return NextResponse.json(
      {
        success: true,
        urlId: job.id,
        status: 'queued',
        priority,
      },
      { status: 202 }
    );
  } catch (err) {
    console.error('Error in webhook reception:', err);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
