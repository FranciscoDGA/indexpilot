import { createClient } from '@/lib/supabase/server';
import type {
  FactSEO, FactCrawl, FactContent, FactCompetitor,
  FactAIUsage, FactBilling, FactMonitoring, FactAutomation,
  DimDate, DimSite, DimTenant, ExecutiveMetric,
  TrendDirection
} from '@/types/analytics';

export class DataWarehouse {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async getDimDate(dateStr: string): Promise<DimDate | null> {
    const { data, error } = await this.supabase
      .from('dim_dates')
      .select('*')
      .eq('date', dateStr)
      .single();

    if (error) return null;
    return data as DimDate;
  }

  async ensureDimDate(dateStr: string): Promise<DimDate> {
    const existing = await this.getDimDate(dateStr);
    if (existing) return existing;

    const d = new Date(dateStr);
    const dimDate = {
      date: dateStr,
      day: d.getDate(),
      day_of_week: d.getDay(),
      day_name: d.toLocaleDateString('en', { weekday: 'short' }),
      month: d.getMonth() + 1,
      month_name: d.toLocaleDateString('en', { month: 'short' }),
      quarter: Math.ceil((d.getMonth() + 1) / 3),
      year: d.getFullYear(),
      week_of_year: this.getWeekOfYear(d),
      is_weekend: d.getDay() === 0 || d.getDay() === 6,
      fiscal_year: d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear(),
      fiscal_quarter: d.getMonth() >= 9 ? 1 : Math.ceil((d.getMonth() + 1) / 3),
    };

    const { data, error } = await this.supabase
      .from('dim_dates')
      .insert(dimDate)
      .select()
      .single();

    if (error) throw error;
    return data as DimDate;
  }

  async ensureDimSite(siteId: string, tenantId: string, name: string, domain: string): Promise<DimSite> {
    const { data: existing } = await this.supabase
      .from('dim_sites')
      .select('*')
      .eq('site_id', siteId)
      .single();

    if (existing) return existing as DimSite;

    const { data, error } = await this.supabase
      .from('dim_sites')
      .insert({ site_id: siteId, tenant_id: tenantId, name, domain })
      .select()
      .single();

    if (error) throw error;
    return data as DimSite;
  }

  async ensureDimTenant(tenantId: string, name: string, plan?: string): Promise<DimTenant> {
    const { data: existing } = await this.supabase
      .from('dim_tenants')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (existing) return existing as DimTenant;

    const { data, error } = await this.supabase
      .from('dim_tenants')
      .insert({ tenant_id: tenantId, name, plan })
      .select()
      .single();

    if (error) throw error;
    return data as DimTenant;
  }

  async loadFactSEO(records: Omit<FactSEO, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { data, error } = await this.supabase.from('fact_seo').upsert(records, { onConflict: 'date_id,site_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactCrawl(records: Omit<FactCrawl, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_crawls').upsert(records, { onConflict: 'date_id,site_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactContent(records: Omit<FactContent, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_content').upsert(records, { onConflict: 'date_id,site_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactCompetitor(records: Omit<FactCompetitor, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_competitors').upsert(records, { onConflict: 'date_id,site_id,competitor_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactAIUsage(records: Omit<FactAIUsage, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_ai_usage').upsert(records, { onConflict: 'date_id,tenant_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactBilling(records: Omit<FactBilling, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_billing').upsert(records, { onConflict: 'date_id,tenant_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactMonitoring(records: Omit<FactMonitoring, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_monitoring').upsert(records, { onConflict: 'date_id,site_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async loadFactAutomation(records: Omit<FactAutomation, 'id' | 'created_at'>[]): Promise<{ loaded: number; errors: any[] }> {
    const { error } = await this.supabase.from('fact_automations').upsert(records, { onConflict: 'date_id,tenant_id' });
    if (error) return { loaded: 0, errors: [{ message: error.message }] };
    return { loaded: records.length, errors: [] };
  }

  async queryFactTable(table: string, params: {
    tenantId?: string;
    siteId?: string;
    startDate: string;
    endDate: string;
    groupBy?: string[];
    metrics?: string[];
    limit?: number;
  }): Promise<Record<string, any>[]> {
    let query = this.supabase
      .from(table)
      .select('*')
      .gte('created_at', params.startDate)
      .lte('created_at', params.endDate)
      .order('created_at', { ascending: true });

    if (params.tenantId) query = query.eq('tenant_id', params.tenantId);
    if (params.siteId) query = query.eq('site_id', params.siteId);
    if (params.limit) query = query.limit(params.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getMetricTrend(tenantId: string, metricKey: string, days: number = 30): Promise<{ date: string; value: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('executive_metrics')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('metric_key', metricKey)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((d: any) => ({ date: d.created_at, value: d.metric_value }));
  }

  private getWeekOfYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}