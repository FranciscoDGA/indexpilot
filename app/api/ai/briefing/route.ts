import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BriefingGenerator } from '@/lib/aiops';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const latest = searchParams.get('latest') === 'true';

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const generator = new BriefingGenerator();

    if (latest) {
      const briefing = await generator.getLatestBriefing(tenantId);
      return NextResponse.json({ success: true, data: briefing });
    }

    const briefings = await generator.getBriefings(tenantId);
    return NextResponse.json({ success: true, data: briefings });
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
    const { tenant_id } = body;

    if (!tenant_id) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const generator = new BriefingGenerator();
    const briefing = await generator.generateBriefing(tenant_id);

    return NextResponse.json({ success: true, data: briefing });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}