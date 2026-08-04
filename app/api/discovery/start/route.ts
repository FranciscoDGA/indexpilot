import { NextRequest, NextResponse } from 'next/server';
import { SitemapDiscoverer } from '@/lib/discovery/sitemapDiscoverer';
import { URLCrawler } from '@/lib/discovery/crawler';
import { GoogleIndexer } from '@/lib/discovery/googleIndexer';
import { MetadataExtractor } from '@/lib/discovery/metadataExtractor';
import { URLSynchronizer } from '@/lib/discovery/urlSynchronizer';

export async function POST(request: NextRequest) {
  try {
    const { siteId, siteUrl, userId } = await request.json();

    if (!siteId || !siteUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: siteId, siteUrl, userId' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/client')).supabase;

    const logId = crypto.randomUUID();
    await supabaseClient.from('sync_logs').insert({
      id: logId,
      site_id: siteId,
      user_id: userId,
      sync_type: 'full',
      status: 'in_progress',
      urls_found: 0,
      urls_new: 0,
      urls_removed: 0,
      urls_updated: 0,
      started_at: new Date().toISOString(),
    });

    return NextResponse.json({
      logId,
      status: 'started',
      message: 'Site discovery started. You can check the status with the log ID.',
    }, { status: 202 });
  } catch (error) {
    console.error('Discovery API error:', error);
    return NextResponse.json(
      { error: 'Failed to start site discovery' },
      { status: 500 }
    );
  }
}
