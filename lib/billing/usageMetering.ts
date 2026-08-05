import { createClient } from '@/lib/supabase/server';
import type { UsageRecord, UsageResource, UsageSummary } from '@/types/billing';
import { PlansManager } from './plansManager';
import { SubscriptionEngine } from './subscriptionEngine';

export class UsageMetering {
  private supabase: ReturnType<typeof createClient>;
  private plansManager: PlansManager;
  private subscriptionEngine: SubscriptionEngine;

  constructor() {
    this.supabase = createClient();
    this.plansManager = new PlansManager();
    this.subscriptionEngine = new SubscriptionEngine();
  }

  async recordUsage(params: {
    tenantId: string;
    resource: UsageResource;
    quantity: number;
    unitCost?: number;
    metadata?: Record<string, any>;
  }): Promise<UsageRecord> {
    const totalCost = params.quantity * (params.unitCost || 0);

    const { data, error } = await this.supabase
      .from('usage_records')
      .insert({
        tenant_id: params.tenantId,
        resource: params.resource,
        quantity: params.quantity,
        unit_cost: params.unitCost || 0,
        total_cost: totalCost,
        recorded_at: new Date().toISOString(),
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUsageSummary(tenantId: string, periodStart?: string, periodEnd?: string): Promise<UsageSummary[]> {
    const subscription = await this.subscriptionEngine.getSubscription(tenantId);
    const plan = subscription ? await this.plansManager.getPlan(subscription.plan_id) : null;
    const limits = plan?.limits || {};

    const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const end = periodEnd || new Date().toISOString();

    const { data: records, error } = await this.supabase
      .from('usage_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('recorded_at', start)
      .lte('recorded_at', end);

    if (error) throw error;

    const usageByResource: Record<string, number> = {};
    const costByResource: Record<string, number> = {};

    for (const record of records || []) {
      usageByResource[record.resource] = (usageByResource[record.resource] || 0) + record.quantity;
      costByResource[record.resource] = (costByResource[record.resource] || 0) + record.total_cost;
    }

    const resources: UsageResource[] = ['urls', 'crawls', 'indexations', 'ai_queries', 'api_calls', 'storage_gb', 'users', 'competitors', 'monitoring'];

    return resources.map(resource => {
      const limitKey = `max_${resource === 'monitoring' ? 'monitoring_urls' : resource}`;
      const limit = (limits as any)[limitKey] || 0;
      const used = usageByResource[resource] || 0;

      return {
        resource,
        used,
        limit,
        percentage: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
        cost: costByResource[resource] || 0,
      };
    });
  }

  async checkUsageLimits(tenantId: string): Promise<{
    within_limits: boolean;
    exceeded_resources: string[];
    warnings: string[];
  }> {
    const summary = await this.getUsageSummary(tenantId);
    const exceeded: string[] = [];
    const warnings: string[] = [];

    for (const item of summary) {
      if (item.limit > 0 && item.used >= item.limit) {
        exceeded.push(item.resource);
      } else if (item.limit > 0 && item.percentage >= 80) {
        warnings.push(`${item.resource}: ${item.percentage}% used`);
      }
    }

    return {
      within_limits: exceeded.length === 0,
      exceeded_resources: exceeded,
      warnings,
    };
  }

  async getUsageTrend(tenantId: string, months: number = 6): Promise<{
    month: string;
    usage: Record<string, number>;
    cost: number;
  }[]> {
    const trends: { month: string; usage: Record<string, number>; cost: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

      const { data: records } = await this.supabase
        .from('usage_records')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('recorded_at', start)
        .lte('recorded_at', end);

      const usage: Record<string, number> = {};
      let cost = 0;

      for (const record of records || []) {
        usage[record.resource] = (usage[record.resource] || 0) + record.quantity;
        cost += record.total_cost;
      }

      trends.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        usage,
        cost,
      });
    }

    return trends;
  }
}