import { createClient } from '@/lib/supabase/server';
import type { AIMemory, AILearning, MemoryOutcome } from '@/types/aiops';

export class LearningEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async recordMemory(params: {
    tenantId: string;
    contextType: string;
    contextKey?: string;
    actionTaken: string;
    ActionResult?: string;
    outcome?: MemoryOutcome;
    confidenceBefore?: number;
    confidenceAfter?: number;
    lessonsLearned?: string[];
    metadata?: Record<string, any>;
  }): Promise<AIMemory> {
    const { data, error } = await this.supabase
      .from('ai_memory')
      .insert({
        tenant_id: params.tenantId,
        context_type: params.contextType,
        context_key: params.contextKey,
        action_taken: params.actionTaken,
        action_result: params.ActionResult,
        outcome: params.outcome,
        confidence_before: params.confidenceBefore,
        confidence_after: params.confidenceAfter,
        lessons_learned: params.lessonsLearned || [],
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIMemory;
  }

  async getMemory(tenantId: string, options?: {
    contextType?: string;
    outcome?: MemoryOutcome;
    limit?: number;
  }): Promise<AIMemory[]> {
    let query = this.supabase
      .from('ai_memory')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options?.contextType) query = query.eq('context_type', options.contextType);
    if (options?.outcome) query = query.eq('outcome', options.outcome);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AIMemory[];
  }

  async recordLearning(params: {
    tenantId: string;
    patternType: string;
    patternKey: string;
    patternDescription?: string;
    success: boolean;
    impact?: number;
    metadata?: Record<string, any>;
  }): Promise<AILearning> {
    const { data: existing } = await this.supabase
      .from('ai_learning')
      .select('*')
      .eq('tenant_id', params.tenantId)
      .eq('pattern_type', params.patternType)
      .eq('pattern_key', params.patternKey)
      .single();

    if (existing) {
      const e = existing as AILearning;
      const newOccurrences = e.occurrences + 1;
      const newSuccessRate = ((e.success_rate * e.occurrences) + (params.success ? 1 : 0)) / newOccurrences;
      const newAvgImpact = ((e.avg_impact * e.occurrences) + (params.impact || 0)) / newOccurrences;
      const newConfidence = Math.min(100, e.confidence + (params.success ? 2 : -1));

      const { data, error } = await this.supabase
        .from('ai_learning')
        .update({
          occurrences: newOccurrences,
          success_rate: Math.round(newSuccessRate * 100) / 100,
          avg_impact: Math.round(newAvgImpact * 100) / 100,
          confidence: newConfidence,
          last_seen_at: new Date().toISOString(),
          metadata: { ...e.metadata, ...params.metadata },
          updated_at: new Date().toISOString(),
        })
        .eq('id', e.id)
        .select()
        .single();

      if (error) throw error;
      return data as AILearning;
    }

    const { data, error } = await this.supabase
      .from('ai_learning')
      .insert({
        tenant_id: params.tenantId,
        pattern_type: params.patternType,
        pattern_key: params.patternKey,
        pattern_description: params.patternDescription,
        occurrences: 1,
        success_rate: params.success ? 1 : 0,
        avg_impact: params.impact || 0,
        confidence: 50,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as AILearning;
  }

  async getLearnings(tenantId: string, options?: {
    patternType?: string;
    minConfidence?: number;
    limit?: number;
  }): Promise<AILearning[]> {
    let query = this.supabase
      .from('ai_learning')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('confidence', { ascending: false });

    if (options?.patternType) query = query.eq('pattern_type', options.patternType);
    if (options?.minConfidence) query = query.gte('confidence', options.minConfidence);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AILearning[];
  }

  async getTopPatterns(tenantId: string, limit: number = 10): Promise<AILearning[]> {
    return this.getLearnings(tenantId, { minConfidence: 60, limit });
  }

  async getMemoryStats(tenantId: string): Promise<{
    total_memories: number;
    positive_outcomes: number;
    negative_outcomes: number;
    total_learnings: number;
    high_confidence_learnings: number;
    avg_confidence: number;
  }> {
    const [memories, learnings] = await Promise.all([
      this.supabase.from('ai_memory').select('outcome, confidence_after').eq('tenant_id', tenantId),
      this.supabase.from('ai_learning').select('confidence').eq('tenant_id', tenantId),
    ]);

    const memData = (memories.data || []) as { outcome: string; confidence_after: number }[];
    const learnData = (learnings.data || []) as { confidence: number }[];

    return {
      total_memories: memData.length,
      positive_outcomes: memData.filter(m => m.outcome === 'positive').length,
      negative_outcomes: memData.filter(m => m.outcome === 'negative').length,
      total_learnings: learnData.length,
      high_confidence_learnings: learnData.filter(l => l.confidence >= 70).length,
      avg_confidence: learnData.length > 0 ? Math.round(learnData.reduce((s, l) => s + l.confidence, 0) / learnData.length) : 0,
    };
  }
}