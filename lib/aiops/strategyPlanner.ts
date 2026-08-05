import { createClient } from '@/lib/supabase/server';
import type { AIStrategy, StrategyStep, StrategyStatus } from '@/types/aiops';

export class StrategyPlanner {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createStrategy(params: {
    tenantId: string;
    title: string;
    description?: string;
    goalId?: string;
    steps?: StrategyStep[];
    confidence?: number;
    estimatedImpact?: number;
    estimatedDurationDays?: number;
  }): Promise<AIStrategy> {
    const { data, error } = await this.supabase
      .from('ai_strategies')
      .insert({
        tenant_id: params.tenantId,
        goal_id: params.goalId,
        title: params.title,
        description: params.description,
        steps: params.steps || [],
        status: 'draft',
        confidence: params.confidence || 0,
        estimated_impact: params.estimatedImpact || 0,
        estimated_duration_days: params.estimatedDurationDays,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIStrategy;
  }

  async getStrategies(tenantId: string, status?: StrategyStatus): Promise<AIStrategy[]> {
    let query = this.supabase
      .from('ai_strategies')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AIStrategy[];
  }

  async approveStrategy(strategyId: string, approvedBy: string): Promise<AIStrategy> {
    const { data, error } = await this.supabase
      .from('ai_strategies')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return data as AIStrategy;
  }

  async startExecution(strategyId: string): Promise<AIStrategy> {
    const { data, error } = await this.supabase
      .from('ai_strategies')
      .update({
        status: 'executing',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return data as AIStrategy;
  }

  async updateStepProgress(strategyId: string, stepIndex: number, status: 'running' | 'completed' | 'failed', result?: string): Promise<AIStrategy> {
    const { data: current } = await this.supabase
      .from('ai_strategies')
      .select('steps, execution_log')
      .eq('id', strategyId)
      .single();

    if (!current) throw new Error('Strategy not found');

    const log = (current as any).execution_log || [];
    log.push({
      step: stepIndex,
      status,
      started_at: status === 'running' ? new Date().toISOString() : undefined,
      completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
      result,
    });

    const { data, error } = await this.supabase
      .from('ai_strategies')
      .update({
        execution_log: log,
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return data as AIStrategy;
  }

  async completeStrategy(strategyId: string, resultSummary: string): Promise<AIStrategy> {
    const { data, error } = await this.supabase
      .from('ai_strategies')
      .update({
        status: 'completed',
        result_summary: resultSummary,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)
      .select()
      .single();

    if (error) throw error;
    return data as AIStrategy;
  }

  async generateStrategy(params: {
    tenantId: string;
    goalId?: string;
    title?: string;
    context?: Record<string, any>;
    maxSteps?: number;
  }): Promise<AIStrategy> {
    const steps: StrategyStep[] = [
      { order: 0, title: 'Analyze Current State', description: 'Gather metrics and identify issues', module: 'analytics', action: 'query_metrics', params: {}, estimated_duration_hours: 1, dependencies: [], auto_executable: true },
      { order: 1, title: 'Identify Root Causes', description: 'Correlate data to find underlying issues', module: 'analytics', action: 'correlate_events', params: {}, estimated_duration_hours: 2, dependencies: [0], auto_executable: true },
      { order: 2, title: 'Generate Action Plan', description: 'Create prioritized action items', module: 'aiops', action: 'generate_plan', params: {}, estimated_duration_hours: 1, dependencies: [1], auto_executable: true },
      { order: 3, title: 'Execute Actions', description: 'Implement approved changes', module: 'automation', action: 'execute_plan', params: {}, estimated_duration_hours: 4, dependencies: [2], auto_executable: false },
      { order: 4, title: 'Verify Results', description: 'Check if goals are being met', module: 'analytics', action: 'verify_goals', params: {}, estimated_duration_hours: 1, dependencies: [3], auto_executable: true },
    ];

    return this.createStrategy({
      tenantId: params.tenantId,
      title: params.title || 'Auto-generated Strategy',
      goalId: params.goalId,
      steps: steps.slice(0, params.maxSteps || 5),
      confidence: 75,
      estimatedImpact: 60,
      estimatedDurationDays: 7,
    });
  }

  async getStrategyStats(tenantId: string): Promise<{
    total: number;
    draft: number;
    active: number;
    completed: number;
    avg_confidence: number;
    avg_impact: number;
  }> {
    const { data } = await this.supabase
      .from('ai_strategies')
      .select('status, confidence, estimated_impact')
      .eq('tenant_id', tenantId);

    const strategies = (data || []) as { status: string; confidence: number; estimated_impact: number }[];

    return {
      total: strategies.length,
      draft: strategies.filter(s => s.status === 'draft').length,
      active: strategies.filter(s => ['approved', 'executing'].includes(s.status)).length,
      completed: strategies.filter(s => s.status === 'completed').length,
      avg_confidence: strategies.length > 0 ? Math.round(strategies.reduce((sum, s) => sum + s.confidence, 0) / strategies.length) : 0,
      avg_impact: strategies.length > 0 ? Math.round(strategies.reduce((sum, s) => sum + s.estimated_impact, 0) / strategies.length) : 0,
    };
  }
}