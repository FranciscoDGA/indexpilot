import { createClient } from '@/lib/supabase/server';
import type { AIGovernancePolicy, PolicyType } from '@/types/aiops';

export class AIGovernance {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createPolicy(params: {
    tenantId: string;
    policyType: PolicyType;
    module?: string;
    action?: string;
    maxConfidence?: number;
    maxImpact?: number;
    rateLimitPerHour?: number;
    rateLimitPerDay?: number;
    scopeRestrictions?: Record<string, any>;
    description?: string;
  }): Promise<AIGovernancePolicy> {
    const { data, error } = await this.supabase
      .from('ai_governance')
      .insert({
        tenant_id: params.tenantId,
        policy_type: params.policyType,
        module: params.module,
        action: params.action,
        max_confidence: params.maxConfidence,
        max_impact: params.maxImpact,
        rate_limit_per_hour: params.rateLimitPerHour,
        rate_limit_per_day: params.rateLimitPerDay,
        scope_restrictions: params.scopeRestrictions || {},
        description: params.description,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIGovernancePolicy;
  }

  async getPolicies(tenantId: string): Promise<AIGovernancePolicy[]> {
    const { data, error } = await this.supabase
      .from('ai_governance')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AIGovernancePolicy[];
  }

  async updatePolicy(policyId: string, updates: Partial<AIGovernancePolicy>): Promise<AIGovernancePolicy> {
    const { data, error } = await this.supabase
      .from('ai_governance')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', policyId)
      .select()
      .single();

    if (error) throw error;
    return data as AIGovernancePolicy;
  }

  async deactivatePolicy(policyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_governance')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', policyId);

    if (error) throw error;
  }

  async deletePolicy(policyId: string): Promise<void> {
    const { error } = await this.supabase.from('ai_governance').delete().eq('id', policyId);
    if (error) throw error;
  }

  async checkActionAllowed(tenantId: string, module: string, action: string, confidence: number, impact: number): Promise<{
    allowed: boolean;
    reason: string;
    requiresApproval: boolean;
  }> {
    const policies = await this.getPolicies(tenantId);
    const activePolicies = policies.filter(p => p.is_active);

    for (const policy of activePolicies) {
      if (policy.policy_type === 'forbidden') {
        if (policy.module && policy.module !== module) continue;
        if (policy.action && policy.action !== action) continue;
        return { allowed: false, reason: `Action '${action}' is forbidden by policy`, requiresApproval: false };
      }

      if (policy.policy_type === 'require_approval') {
        if (policy.module && policy.module !== module) continue;
        if (policy.action && policy.action !== action) continue;
        if (policy.max_confidence && confidence < policy.max_confidence) continue;
        if (policy.max_impact && impact > policy.max_impact) continue;
        return { allowed: true, reason: 'Requires human approval', requiresApproval: true };
      }

      if (policy.policy_type === 'auto_approve') {
        if (policy.module && policy.module !== module) continue;
        if (policy.action && policy.action !== action) continue;
        if (policy.max_confidence && confidence < policy.max_confidence) continue;
        if (policy.max_impact && impact > policy.max_impact) continue;
        return { allowed: true, reason: 'Auto-approved by policy', requiresApproval: false };
      }

      if (policy.policy_type === 'rate_limit') {
        const limit = policy.rate_limit_per_hour || 10;
        const { count } = await this.supabase
          .from('ai_audit_log')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('action', action)
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if ((count || 0) >= limit) {
          return { allowed: false, reason: `Rate limit exceeded (${limit}/hour)`, requiresApproval: false };
        }
      }
    }

    return { allowed: true, reason: 'No blocking policies found', requiresApproval: false };
  }

  async getAuditLog(tenantId: string, options?: {
    eventType?: string;
    entityType?: string;
    limit?: number;
  }): Promise<any[]> {
    let query = this.supabase
      .from('ai_audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options?.eventType) query = query.eq('event_type', options.eventType);
    if (options?.entityType) query = query.eq('entity_type', options.entityType);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getDefaultPolicies(tenantId: string): Promise<void> {
    const defaults = [
      { policyType: 'require_approval' as PolicyType, module: 'automation', action: 'delete', maxImpact: 5, description: 'Require approval for destructive automation actions' },
      { policyType: 'auto_approve' as PolicyType, module: 'analytics', action: 'query', maxConfidence: 80, description: 'Auto-approve analytics queries' },
      { policyType: 'rate_limit' as PolicyType, module: 'aiops', action: 'strategy_execute', rateLimitPerHour: 5, rateLimitPerDay: 20, description: 'Limit strategy execution rate' },
      { policyType: 'require_approval' as PolicyType, module: 'billing', maxImpact: 7, description: 'Require approval for billing-related changes' },
    ];

    for (const policy of defaults) {
      const existing = await this.supabase
        .from('ai_governance')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('policy_type', policy.policyType)
        .eq('module', policy.module)
        .limit(1);

      if (!existing.data || existing.data.length === 0) {
        await this.createPolicy({ tenantId, ...policy });
      }
    }
  }
}