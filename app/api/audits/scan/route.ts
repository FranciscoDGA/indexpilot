import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SeoScanner } from '@/lib/seo/scanner';
import { RecommendationEngine } from '@/lib/seo/recommendationEngine';

const scanRequestSchema = z.object({
  publication_id: z.string().uuid(),
  url: z.string().url(),
  site_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie (or use mock)
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
    const sessionCookie = request.cookies.get('sb-access-token');

    if (!useMock && !sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { publication_id, url, site_id } = scanRequestSchema.parse(body);

    // Get user ID (for demo, use mock)
    const userId = useMock ? 'mock-user-123' : sessionCookie?.value;

    if (!userId && !useMock) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Supabase client
    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/client')).supabase;

    // Create audit record with pending status
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const insertResult = await supabaseClient
      .from('seo_audits')
      .insert([
        {
          id: auditId,
          publication_id,
          site_id,
          user_id: userId || 'mock-user-123',
          url,
          status: 'scanning',
          score: 0,
          grade: 'D',
        },
      ]);

    if (insertResult?.error) {
      return NextResponse.json(
        { error: 'Failed to create audit record' },
        { status: 500 }
      );
    }

    // Start scan (fire and forget - don't wait)
    performScan(auditId, publication_id, site_id, userId || 'mock-user-123', url, supabaseClient).catch(err => {
      console.error('Scan failed:', err);
    });

    return NextResponse.json(
      {
        audit_id: auditId,
        status: 'scanning',
        message: 'Scan started. Check back for results.',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Scan request error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/audits/scan/[id] - Check scan status
export async function GET(request: NextRequest) {
  try {
    const auditId = request.nextUrl.searchParams.get('id');

    if (!auditId) {
      return NextResponse.json(
        { error: 'Audit ID required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/client')).supabase;

    // For real Supabase, could do complex select with joins
    // For now, keep it simple
    const auditData = await supabaseClient
      .from('seo_audits')
      .select('*')
      .eq('id', auditId);

    if (auditData?.error || !auditData?.data?.[0]) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    const audit = auditData.data[0];

    const checksData = await supabaseClient
      .from('seo_checks')
      .select('*')
      .eq('audit_id', auditId);

    return NextResponse.json({
      audit: {
        ...audit,
        seo_checks: checksData?.data || [],
      },
    });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Background scan function
async function performScan(
  auditId: string,
  publicationId: string,
  siteId: string,
  userId: string,
  url: string,
  supabase: any
) {
  try {
    const scanner = new SeoScanner();
    const recommendationEngine = new RecommendationEngine();

    // Run scan
    const scanResult = await scanner.scanUrl(url);

    // Prepare checks for database
    const checksToInsert = scanResult.checks.map(check => ({
      audit_id: auditId,
      check_name: check.check_name,
      status: check.status,
      severity: check.severity,
      message: check.message,
      recommendation: recommendationEngine.getRecommendation(check),
      details: check.details || {},
    }));

    // Insert checks
    const { error: checksError } = await supabase
      .from('seo_checks')
      .insert(checksToInsert);

    if (checksError) {
      throw new Error(`Failed to insert checks: ${checksError.message}`);
    }

    // Update audit with results
    const { error: updateError } = await supabase
      .from('seo_audits')
      .update({
        status: 'completed',
        score: scanResult.score,
        grade: scanResult.grade,
        scanned_at: new Date().toISOString(),
      })
      .eq('id', auditId);

    if (updateError) {
      throw new Error(`Failed to update audit: ${updateError.message}`);
    }

    // Save to history
    const { error: historyError } = await supabase
      .from('seo_audit_history')
      .insert([
        {
          publication_id: publicationId,
          site_id: siteId,
          user_id: userId,
          score_at_date: new Date().toISOString(),
          score: scanResult.score,
          grade: scanResult.grade,
        },
      ]);

    if (historyError) {
      console.error('Failed to save to history:', historyError);
      // Don't throw - this is non-critical
    }
  } catch (error) {
    console.error('Scan error:', error);

    // Update audit with error status
    try {
      await supabase
        .from('seo_audits')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', auditId);
    } catch (updateError) {
      console.error('Failed to update audit error status:', updateError);
    }
  }
}
