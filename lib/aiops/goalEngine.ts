import { createClient } from '@/lib/supabase/server';
import type { AIGoal, GoalCategory, GoalStatus } from '@/types/aiops';

export class GoalEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createGoal(params: {
    tenantId: string;
    title: string;
    description?: string;
    category: GoalCategory;
    metricKey: string;
    targetValue: number;
    deadline?: string;
    priority?: number;
  }): Promise<AIGoal> {
    const { data, error } = await this.supabase
      .from('ai_goals')
      .insert({
        tenant_id: params.tenantId,
        title: params.title,
        description: params.description,
        category: params.category,
        metric_key: params.metricKey,
        target_value: params.targetValue,
        deadline: params.deadline,
        priority: params.priority || 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIGoal;
  }

  async getGoals(tenantId: string, status?: GoalStatus): Promise<AIGoal[]> {
    let query = this.supabase
      .from('ai_goals')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('priority', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AIGoal[];
  }

  async updateGoalProgress(goalId: string, currentValue: number): Promise<AIGoal> {
    const { data: goal } = await this.supabase
      .from('ai_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (!goal) throw new Error('Goal not found');

    const g = goal as AIGoal;
    const progressPct = Math.min(100, Math.round((currentValue / g.target_value) * 100));
    const isCompleted = progressPct >= 100;

    const { data, error } = await this.supabase
      .from('ai_goals')
      .update({
        current_value: currentValue,
        progress_pct: progressPct,
        status: isCompleted ? 'completed' : g.status,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as AIGoal;
  }

  async pauseGoal(goalId: string): Promise<AIGoal> {
    const { data, error } = await this.supabase
      .from('ai_goals')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as AIGoal;
  }

  async abandonGoal(goalId: string): Promise<AIGoal> {
    const { data, error } = await this.supabase
      .from('ai_goals')
      .update({ status: 'abandoned', updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as AIGoal;
  }

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await this.supabase.from('ai_goals').delete().eq('id', goalId);
    if (error) throw error;
  }

  async getGoalStats(tenantId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    paused: number;
    abandoned: number;
    avg_progress: number;
    on_track: number;
    at_risk: number;
  }> {
    const goals = await this.getGoals(tenantId);

    return {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length,
      abandoned: goals.filter(g => g.status === 'abandoned').length,
      avg_progress: goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress_pct, 0) / goals.length) : 0,
      on_track: goals.filter(g => g.status === 'active' && g.progress_pct >= 50).length,
      at_risk: goals.filter(g => g.status === 'active' && g.deadline && new Date(g.deadline) < new Date() && g.progress_pct < 100).length,
    };
  }

  async getGoalsNeedingAttention(tenantId: string): Promise<AIGoal[]> {
    const goals = await this.getGoals(tenantId, 'active');
    const now = new Date();

    return goals.filter(g => {
      if (g.deadline && new Date(g.deadline) < now && g.progress_pct < 100) return true;
      if (g.progress_pct < 20 && g.created_at < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()) return true;
      return false;
    });
  }
}