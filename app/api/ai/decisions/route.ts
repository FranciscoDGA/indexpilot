import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DecisionEngine } from '@/lib/aiops';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const status = searchParams.get('status') as any;
    const urgency = searchParams.get('urgency') as any;

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const engine = new DecisionEngine();
    const decisions = await engine.getDecisions(tenantId, { status, urgency, limit: 50 });
    const stats = await engine.getDecisionStats(tenantId);

    return NextResponse.json({ success: true, data: { decisions, stats } });
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
    const { tenant_id, decision_type, title, description, reasoning, confidence, impact_score, urgency, context } = body;

    if (!tenant_id || !decision_type || !title || !reasoning) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const engine = new DecisionEngine();
    const decision = await engine.createDecision({
      tenantId: tenant_id,
      decisionType: decision_type,
      title,
      description,
      reasoning,
      confidence: confidence || 70,
      impactScore: impact_score || 50,
      urgency: urgency || 'medium',
      context,
    });

    return NextResponse.json({ success: true, data: decision });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}