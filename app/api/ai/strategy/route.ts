import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StrategyPlanner } from '@/lib/aiops';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const status = searchParams.get('status') as any;

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const planner = new StrategyPlanner();
    const strategies = await planner.getStrategies(tenantId, status);
    const stats = await planner.getStrategyStats(tenantId);

    return NextResponse.json({ success: true, data: { strategies, stats } });
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
    const { action, tenant_id, goal_id, title, description } = body;

    const planner = new StrategyPlanner();

    if (action === 'generate') {
      const strategy = await planner.generateStrategy({
        tenantId: tenant_id,
        goalId: goal_id,
        title,
      });
      return NextResponse.json({ success: true, data: strategy });
    }

    if (action === 'create') {
      if (!tenant_id || !title) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      const strategy = await planner.createStrategy({ tenantId: tenant_id, goalId: goal_id, title, description });
      return NextResponse.json({ success: true, data: strategy });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}