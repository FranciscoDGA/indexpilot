import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KPIEngine, ExecutiveAlerts, DataWarehouse } from '@/lib/analytics';
import type { ExecutiveDashboard, ExecutiveMetric } from '@/types/analytics';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const period = searchParams.get('period') || '30d';

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const kpiEngine = new KPIEngine();
    const alertsEngine = new ExecutiveAlerts();
    const warehouse = new DataWarehouse();

    // Get KPIs
    const kpis = await kpiEngine.getKPIDefinitions(tenantId);

    // Get alerts
    const alertStats = await alertsEngine.getAlertStats(tenantId);
    const recentAlerts = await alertsEngine.getAlerts(tenantId, { limit: 10 });

    // Get executive metrics
    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

    const { data: metrics } = await supabase
      .from('executive_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    const metricMap = new Map<string, ExecutiveMetric>();
    for (const m of (metrics || []) as ExecutiveMetric[]) {
      if (!metricMap.has(m.metric_key) || new Date(m.created_at) > new Date(metricMap.get(m.metric_key)!.created_at)) {
        metricMap.set(m.metric_key, m);
      }
    }

    const dashboard: ExecutiveDashboard = {
      period,
      metrics: Array.from(metricMap.values()),
      kpis,
      alerts: recentAlerts,
      site_health: {
        total_sites: 0,
        healthy_sites: 0,
        warning_sites: 0,
        critical_sites: 0,
        avg_uptime_pct: 99.9,
        avg_response_time_ms: 250,
      },
      seo_summary: {
        total_indexed_urls: 0,
        avg_seo_score: 0,
        total_errors: 0,
        indexation_trend: 'stable',
        organic_traffic_trend: 'stable',
      },
      content_summary: {
        total_articles: 0,
        new_this_period: 0,
        avg_quality_score: 0,
        semantic_coverage: 0,
        topic_clusters: 0,
      },
      competitor_summary: {
        tracked_competitors: 0,
        avg_market_share: 0,
      },
      ai_summary: {
        total_queries: 0,
        acceptance_rate: 0,
        time_saved_minutes: 0,
        automations_executed: 0,
        cost_usd: 0,
      },
      billing_summary: {
        mrr: 0,
        arr: 0,
        active_subscriptions: 0,
        churn_rate: 0,
        net_revenue: 0,
      },
    };

    // Populate summaries from metrics
    for (const [key, metric] of metricMap) {
      switch (key) {
        case 'seo_score': dashboard.seo_summary.avg_seo_score = metric.metric_value; break;
        case 'indexed_urls': dashboard.seo_summary.total_indexed_urls = metric.metric_value; break;
        case 'total_articles': dashboard.content_summary.total_articles = metric.metric_value; break;
        case 'topic_clusters': dashboard.content_summary.topic_clusters = metric.metric_value; break;
        case 'mrr': dashboard.billing_summary.mrr = metric.metric_value; break;
        case 'arr': dashboard.billing_summary.arr = metric.metric_value; break;
        case 'uptime_pct': dashboard.site_health.avg_uptime_pct = metric.metric_value; break;
        case 'avg_response_time_ms': dashboard.site_health.avg_response_time_ms = metric.metric_value; break;
        case 'ai_queries_total': dashboard.ai_summary.total_queries = metric.metric_value; break;
        case 'ai_acceptance_rate': dashboard.ai_summary.acceptance_rate = metric.metric_value; break;
      }
    }

    return NextResponse.json({ success: true, data: dashboard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}