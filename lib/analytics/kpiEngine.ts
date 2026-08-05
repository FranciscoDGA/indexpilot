import { createClient } from '@/lib/supabase/server';
import type { KPIDefinition, KPIValue, KPIWithLatest, TrendDirection } from '@/types/analytics';

export class KPIEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async getKPIDefinitions(tenantId?: string): Promise<KPIWithLatest[]> {
    let query = this.supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true)
      .order('category');

    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    const kpis: KPIWithLatest[] = [];
    for (const kpi of (data || []) as KPIDefinition[]) {
      const latest = await this.getLatestKPIValue(kpi.id, tenantId);
      kpis.push({ ...kpi, ...latest });
    }

    return kpis;
  }

  async getLatestKPIValue(kpiId: string, tenantId?: string): Promise<{
    latest_value?: number;
    previous_value?: number;
    trend?: TrendDirection;
    trend_pct?: number;
    target_met?: boolean;
  }> {
    let query = this.supabase
      .from('kpi_values')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tenantId) query = query.eq('tenant_id', tenantId);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return {};

    const latest = data[0] as KPIValue;
    const previous = data.length > 1 ? data[1] as KPIValue : undefined;

    let trend: TrendDirection = 'stable';
    let trendPct = 0;

    if (previous) {
      const diff = latest.value - previous.value;
      trendPct = previous.value !== 0 ? Math.round((diff / previous.value) * 100) : 0;
      if (diff > 0) trend = 'up';
      else if (diff < 0) trend = 'down';
    } else {
      trend = 'new';
    }

    // Get KPI definition for target
    const { data: kpiDef } = await this.supabase
      .from('kpi_definitions')
      .select('*')
      .eq('id', kpiId)
      .single();

    const kpiDefTyped = kpiDef as KPIDefinition | null;
    const targetMet = kpiDefTyped?.target_value !== undefined
      ? (kpiDefTyped.direction === 'higher_is_better'
        ? latest.value >= kpiDefTyped.target_value
        : latest.value <= kpiDefTyped.target_value)
      : undefined;

    return {
      latest_value: latest.value,
      previous_value: previous?.value,
      trend,
      trend_pct: trendPct,
      target_met: targetMet,
    };
  }

  async computeAndStoreKPI(params: {
    kpiSlug: string;
    tenantId: string;
    value: number;
    dateStr: string;
    notes?: string;
  }): Promise<KPIValue> {
    const { data: kpiDef, error: kpiError } = await this.supabase
      .from('kpi_definitions')
      .select('*')
      .eq('slug', params.kpiSlug)
      .single();

    if (kpiError || !kpiDef) throw new Error(`KPI definition not found: ${params.kpiSlug}`);

    const dateRow = await this.supabase
      .from('dim_dates')
      .select('id')
      .eq('date', params.dateStr)
      .single();

    if (!dateRow.data) throw new Error(`Date dimension not found: ${params.dateStr}`);

    const kpiDefTyped = kpiDef as KPIDefinition;
    const targetMet = kpiDefTyped.target_value !== undefined
      ? (kpiDefTyped.direction === 'higher_is_better'
        ? params.value >= kpiDefTyped.target_value
        : params.value <= kpiDefTyped.target_value)
      : undefined;

    const { data, error } = await this.supabase
      .from('kpi_values')
      .upsert({
        kpi_id: kpiDefTyped.id,
        tenant_id: params.tenantId,
        date_id: dateRow.data.id,
        value: params.value,
        target_met: targetMet,
        notes: params.notes,
      }, { onConflict: 'kpi_id,tenant_id,date_id' })
      .select()
      .single();

    if (error) throw error;
    return data as KPIValue;
  }

  async getKPIHistory(kpiId: string, tenantId: string, days: number = 90): Promise<{
    date: string;
    value: number;
    target_met?: boolean;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('kpi_values')
      .select('*, dim_dates!inner(date)')
      .eq('kpi_id', kpiId)
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((d: any) => ({
      date: d.dim_dates?.date || d.created_at,
      value: d.value,
      target_met: d.target_met,
    }));
  }

  async getDefaultKPIs(): Promise<Omit<KPIDefinition, 'id' | 'created_at' | 'updated_at'>[]> {
    return [
      {
        name: 'SEO Health Index',
        slug: 'seo_health_index',
        description: 'Composite score combining crawl health, errors, indexation, and on-page factors',
        category: 'SEO',
        formula: '(seo_score * 0.3 + (100 - crawl_errors_ratio) * 0.3 + indexation_rate * 0.2 + core_web_vitals * 0.2)',
        unit: 'score',
        target_value: 80,
        warning_threshold: 60,
        critical_threshold: 40,
        direction: 'higher_is_better',
        data_sources: ['fact_seo', 'fact_crawls'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'Index Velocity',
        slug: 'index_velocity',
        description: 'Average number of URLs indexed per day',
        category: 'SEO',
        formula: 'indexed_urls / period_days',
        unit: 'urls/day',
        target_value: 50,
        warning_threshold: 20,
        critical_threshold: 5,
        direction: 'higher_is_better',
        data_sources: ['fact_seo'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'Crawl Efficiency',
        slug: 'crawl_efficiency',
        description: 'Ratio of successfully crawled pages to total crawl attempts',
        category: 'Crawl',
        formula: '(pages_crawled - error_pages) / pages_crawled * 100',
        unit: '%',
        target_value: 95,
        warning_threshold: 85,
        critical_threshold: 70,
        direction: 'higher_is_better',
        data_sources: ['fact_crawls'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'Content Freshness Index',
        slug: 'content_freshness_index',
        description: 'Average freshness score of content across the site',
        category: 'Content',
        formula: 'avg_freshness_score',
        unit: 'score',
        target_value: 75,
        warning_threshold: 50,
        critical_threshold: 30,
        direction: 'higher_is_better',
        data_sources: ['fact_content'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'Automation Efficiency',
        slug: 'automation_efficiency',
        description: 'Percentage of tasks successfully automated',
        category: 'Automation',
        formula: 'workflows_successful / workflows_executed * 100',
        unit: '%',
        target_value: 95,
        warning_threshold: 85,
        critical_threshold: 70,
        direction: 'higher_is_better',
        data_sources: ['fact_automations'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'Opportunity Index',
        slug: 'opportunity_index',
        description: 'Number of prioritized improvement opportunities identified',
        category: 'SEO',
        formula: 'content_gaps_found + cannibalization_issues + missing_meta',
        unit: 'count',
        target_value: 0,
        warning_threshold: 10,
        critical_threshold: 25,
        direction: 'lower_is_better',
        data_sources: ['fact_content', 'fact_seo'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'AI Acceptance Rate',
        slug: 'ai_acceptance_rate',
        description: 'Percentage of AI recommendations accepted by users',
        category: 'AI',
        formula: 'recommendations_accepted / recommendations_made * 100',
        unit: '%',
        target_value: 70,
        warning_threshold: 50,
        critical_threshold: 30,
        direction: 'higher_is_better',
        data_sources: ['fact_ai_usage'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
      {
        name: 'Platform Uptime',
        slug: 'platform_uptime',
        description: 'Site availability percentage',
        category: 'Monitoring',
        formula: 'uptime_pct',
        unit: '%',
        target_value: 99.9,
        warning_threshold: 99,
        critical_threshold: 95,
        direction: 'higher_is_better',
        data_sources: ['fact_monitoring'],
        update_frequency: 'daily',
        is_active: true,
        is_custom: false,
      },
    ];
  }

  async seedDefaultKPIs(): Promise<void> {
    const defaults = await this.getDefaultKPIs();
    for (const kpi of defaults) {
      const { error } = await this.supabase
        .from('kpi_definitions')
        .upsert(kpi, { onConflict: 'slug' });

      if (error) console.error(`Failed to seed KPI ${kpi.slug}:`, error.message);
    }
  }
}