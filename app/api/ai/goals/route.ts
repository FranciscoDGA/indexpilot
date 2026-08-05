import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoalEngine } from '@/lib/aiops';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const status = searchParams.get('status') as any;

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const engine = new GoalEngine();
    const goals = await engine.getGoals(tenantId, status);
    const stats = await engine.getGoalStats(tenantId);

    return NextResponse.json({ success: true, data: { goals, stats } });
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
    const { action, tenant_id, goal_id, title, description, category, metric_key, target_value, deadline } = body;

    const engine = new GoalEngine();

    if (action === 'create') {
      if (!tenant_id || !title || !category || !metric_key || !target_value) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const goal = await engine.createGoal({ tenantId: tenant_id, title, description, category, metricKey: metric_key, targetValue: target_value, deadline });
      return NextResponse.json({ success: true, data: goal });
    }

    if (action === 'update_progress' && goal_id) {
      const goal = await engine.updateGoalProgress(goal_id, body.current_value);
      return NextResponse.json({ success: true, data: goal });
    }

    if (action === 'pause' && goal_id) {
      const goal = await engine.pauseGoal(goal_id);
      return NextResponse.json({ success: true, data: goal });
    }

    if (action === 'abandon' && goal_id) {
      const goal = await engine.abandonGoal(goal_id);
      return NextResponse.json({ success: true, data: goal });
    }

    if (action === 'delete' && goal_id) {
      await engine.deleteGoal(goal_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}