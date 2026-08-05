import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LearningEngine } from '@/lib/aiops';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const contextType = searchParams.get('context_type');

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const engine = new LearningEngine();
    const memory = await engine.getMemory(tenantId, { contextType: contextType || undefined, limit: 50 });
    const stats = await engine.getMemoryStats(tenantId);
    const topPatterns = await engine.getTopPatterns(tenantId);

    return NextResponse.json({ success: true, data: { memory, stats, topPatterns } });
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
    const { action, tenant_id, context_type, context_key, action_taken, action_result, outcome, confidence_before, confidence_after, lessons_learned } = body;

    const engine = new LearningEngine();

    if (action === 'record') {
      if (!tenant_id || !context_type || !action_taken) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const memory = await engine.recordMemory({
        tenantId: tenant_id,
        contextType: context_type,
        contextKey: context_key,
        actionTaken: action_taken,
        ActionResult: action_result,
        outcome,
        confidenceBefore: confidence_before,
        confidenceAfter: confidence_after,
        lessonsLearned: lessons_learned,
      });
      return NextResponse.json({ success: true, data: memory });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}