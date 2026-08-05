import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompetitorCrawler } from '@/lib/competitors';
import { CompetitorManager } from '@/lib/competitors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { id } = await params;

  // Get competitor
  const { data: competitor, error: compError } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', id)
    .single();

  if (compError || !competitor) {
    return Response.json({ error: 'Competitor not found' }, { status: 404 });
  }

  const manager = new CompetitorManager();

  // Start crawl
  const crawl = await manager.startCrawl(id);

  try {
    // Run crawler
    const crawler = new CompetitorCrawler({
      maxPages: 100,
      maxDepth: 5,
      delay: 500,
    });

    const protocol = competitor.domain.includes('://') ? '' : 'https://';
    const startUrl = `${protocol}${competitor.domain}`;
    const pages = await crawler.crawl(startUrl);

    // Save pages
    await manager.saveCompetitorPages(id, crawl.id, pages);

    // Build and save categories
    const categories = crawler.buildArchitecture(pages, competitor.domain);
    await manager.saveCompetitorCategories(id, categories);

    // Update crawl status
    await manager.updateCrawlStatus(crawl.id, 'completed', pages.length);

    return Response.json({
      data: {
        crawl_id: crawl.id,
        pages_found: pages.length,
        categories: categories.length,
        status: 'completed',
      },
    });
  } catch (error: any) {
    await manager.updateCrawlStatus(crawl.id, 'failed', 0, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}