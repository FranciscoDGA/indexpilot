import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PredictiveAnalytics } from '@/lib/analytics';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const metricKey = searchParams.get('metric_key');

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const analytics = new PredictiveAnalytics();

    if (metricKey) {
      const forecasts = await analytics.getExistingForecasts(tenantId, metricKey);
      return NextResponse.json({ success: true, data: forecasts });
    }

    const forecasts = await analytics.getExistingForecasts(tenantId);
    return NextResponse.json({ success: true, data: forecasts });
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
    const { tenant_id, metric_key, forecast_type, periods, confidence_level } = body;

    if (!tenant_id || !metric_key) {
      return NextResponse.json({ error: 'tenant_id and metric_key required' }, { status: 400 });
    }

    const analytics = new PredictiveAnalytics();
    const forecasts = await analytics.generateForecast({
      tenantId: tenant_id,
      metricKey: metric_key,
      forecastType: forecast_type,
      periods: periods || 30,
      confidenceLevel: confidence_level,
    });

    return NextResponse.json({ success: true, data: forecasts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}