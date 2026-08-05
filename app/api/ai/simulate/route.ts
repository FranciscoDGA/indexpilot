import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ScenarioSimulator } from '@/lib/aiops';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const simulator = new ScenarioSimulator();
    const simulations = await simulator.getSimulations(tenantId);

    return NextResponse.json({ success: true, data: simulations });
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
    const { tenant_id, scenario_type, name, description, input_params, assumptions, time_horizon_days } = body;

    if (!tenant_id || !scenario_type || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const simulator = new ScenarioSimulator();
    const simulation = await simulator.runSimulation({
      tenantId: tenant_id,
      scenario_type,
      name,
      description,
      input_params: input_params || {},
      assumptions,
      time_horizon_days,
    });

    return NextResponse.json({ success: true, data: simulation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}