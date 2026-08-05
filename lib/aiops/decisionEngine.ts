import { createClient } from '@/lib/supabase/server';
import type { AIDecision, DecisionType, UrgencyLevel, DecisionStatus } from '@/types/aiops';

export class DecisionEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createDecision(params: {
    tenantId: string;
    decisionType: DecisionType;
    title: string;
    description?: string;
    context?: Record<string, any>;
    reasoning: string;
    confidence: number;
    impactScore: number;
    urgency: UrgencyLevel;
    dependencies?: string[];
    autoExecutable?: boolean;
    requiresApproval?: boolean;
    strategyId?: string;
  }): Promise<AIDecision> {
    // Check governance policies
    const needsApproval = await this.checkGovernance(params.tenantId, params.decisionType, params.confidence, params.impactScore);

    const { data, error } = await this.supabase
      .from('ai_decisions')
      .insert({
        tenant_id: params.tenantId,
        strategy_id: params.strategyId,
        decision_type: params.decisionType,
        title: params.title,
        description: params.description,
        context: params.context || {},
        reasoning: params.reasoning,
        confidence: params.confidence,
        impact_score: params.impactScore,
        urgency: params.urgency,
        dependencies: params.dependencies || [],
        auto_executable: params.autoExecutable || false,
        requires_approval: needsApproval || params.requiresApproval !== false,
        status: needsApproval ? 'pending' : (params.autoExecutable ? 'approved' : 'pending'),
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await this.logAudit(params.tenantId, 'decision_created', 'decision', data.id, 'create', { confidence: params.confidence, urgency: params.urgency });

    return data as AIDecision;
  }

  async getDecisions(tenantId: string, options?: {
    status?: DecisionStatus;
    urgency?: UrgencyLevel;
    type?: DecisionType;
    limit?: number;
  }): Promise<AIDecision[]> {
    let query = this.supabase
      .from('ai_decisions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.urgency) query = query.eq('urgency', options.urgency);
    if (options?.type) query = query.eq('decision_type', options.type);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AIDecision[];
  }

  async approveDecision(decisionId: string, approvedBy: string): Promise<AIDecision> {
    const { data, error } = await this.supabase
      .from('ai_decisions')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data as AIDecision;
  }

  async rejectDecision(decisionId: string, reason: string): Promise<AIDecision> {
    const { data, error } = await this.supabase
      .from('ai_decisions')
      .update({
        status: 'rejected',
        rejected_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', decisionId)
      .select()
      .single();

    if (error) throw error;
    return data as AIDecision;
  }

  async getDecisionStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    executing: number;
    completed: number;
    avg_confidence: number;
    avg_impact: number;
  }> {
    const { data } = await this.supabase
      .from('ai_decisions')
      .select('status, confidence, impact_score')
      .eq('tenant_id', tenantId);

    const decisions = (data || []) as { status: string; confidence: number; impact_score: number }[];

    return {
      total: decisions.length,
      pending: decisions.filter(d => d.status === 'pending').length,
      approved: decisions.filter(d => d.status === 'approved').length,
      rejected: decisions.filter(d => d.status === 'rejected').length,
      executing: decisions.filter(d => d.status === 'executing').length,
      completed: decisions.filter(d => d.status === 'completed').length,
      avg_confidence: decisions.length > 0 ? Math.round(decisions.reduce((s, d) => s + d.confidence, 0) / decisions.length) : 0,
      avg_impact: decisions.length > 0 ? Math.round(decisions.reduce((s, d) => s + d.impact_score, 0) / decisions.length) : 0,
    };
  }

  private async checkGovernance(tenantId: string, decisionType: string, confidence: number, impact: number): Promise<boolean> {
    const { data } = await this.supabase
      .from('ai_governance')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    const policies = (data || []) as any[];

    for (const policy of policies) {
      if (policy.policy_type === 'forbidden') continue;
      if (policy.max_confidence && confidence < policy.max_confidence) continue;
      if (policy.max_impact && impact > policy.max_impact) continue;
      if (policy.policy_type === 'require_approval') return true;
    }

    return false;
  }

  private async logAudit(tenantId: string, eventType: string, entityType: string, entityId: string, action: string, details: Record<string, any>): Promise<void> {
    await this.supabase.from('ai_audit_log').insert({
      tenant_id: tenantId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor: 'ai',
      details,
    });
  }
}