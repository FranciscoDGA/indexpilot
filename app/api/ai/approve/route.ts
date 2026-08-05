import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DecisionEngine, StrategyPlanner } from '@/lib/aiops';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, entity_type, entity_id, reason } = body;

    if (!action || !entity_type || !entity_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (entity_type === 'decision') {
      const engine = new DecisionEngine();
      if (action === 'approve') {
        const decision = await engine.approveDecision(entity_id, user.id);
        return NextResponse.json({ success: true, data: decision });
      }
      if (action === 'reject') {
        const decision = await engine.rejectDecision(entity_id, reason || 'Rejected by user');
        return NextResponse.json({ success: true, data: decision });
      }
    }

    if (entity_type === 'strategy') {
      const planner = new StrategyPlanner();
      if (action === 'approve') {
        const strategy = await planner.approveStrategy(entity_id, user.id);
        return NextResponse.json({ success: true, data: strategy });
      }
    }

    return NextResponse.json({ error: 'Invalid action or entity type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}