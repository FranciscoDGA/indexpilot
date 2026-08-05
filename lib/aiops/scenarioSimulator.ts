import { createClient } from '@/lib/supabase/server';
import type { AISimulation, ScenarioType, SimulationInput } from '@/types/aiops';

export class ScenarioSimulator {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async runSimulation(params: SimulationInput & { tenantId: string }): Promise<AISimulation> {
    const startTime = Date.now();

    const predictedOutcomes = this.calculateOutcomes(params.scenario_type, params.input_params, params.time_horizon_days || 90);

    const { data, error } = await this.supabase
      .from('ai_simulations')
      .insert({
        tenant_id: params.tenantId,
        name: params.name,
        description: params.description,
        scenario_type: params.scenario_type,
        input_params: params.input_params,
        assumptions: params.assumptions || [],
        predicted_outcomes: predictedOutcomes,
        confidence_level: 95,
        time_horizon_days: params.time_horizon_days || 90,
        status: 'completed',
        execution_time_ms: Date.now() - startTime,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AISimulation;
  }

  async getSimulations(tenantId: string, limit: number = 20): Promise<AISimulation[]> {
    const { data, error } = await this.supabase
      .from('ai_simulations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AISimulation[];
  }

  async deleteSimulation(simulationId: string): Promise<void> {
    const { error } = await this.supabase.from('ai_simulations').delete().eq('id', simulationId);
    if (error) throw error;
  }

  private calculateOutcomes(scenarioType: ScenarioType, params: Record<string, any>, horizonDays: number): Record<string, any> {
    const months = Math.ceil(horizonDays / 30);

    switch (scenarioType) {
      case 'content_growth': {
        const articlesPerMonth = params.articles_per_month || 10;
        const growthRate = params.growth_rate || 0.05;
        const projectedArticles = articlesPerMonth * months;
        const projectedTraffic = params.current_traffic
          ? Math.round(params.current_traffic * Math.pow(1 + growthRate, months))
          : 0;
        const projectedIndexation = params.current_indexed
          ? Math.round(params.current_indexed + projectedArticles * 0.85)
          : 0;
        return {
          projected_articles: projectedArticles,
          projected_traffic: projectedTraffic,
          projected_indexed_urls: projectedIndexation,
          estimated_seo_score_improvement: Math.min(20, months * 1.5),
          confidence: 75,
          timeline_months: months,
        };
      }
      case 'indexation_forecast': {
        const currentRate = params.current_indexation_rate || 60;
        const targetRate = params.target_indexation_rate || 90;
        const monthlyImprovement = params.monthly_improvement || 3;
        const projectedRate = Math.min(100, currentRate + monthlyImprovement * months);
        return {
          current_rate: currentRate,
          projected_rate: projectedRate,
          target_rate: targetRate,
          months_to_target: projectedRate >= targetRate ? Math.ceil((targetRate - currentRate) / monthlyImprovement) : null,
          urls_to_reindex: params.total_urls ? Math.round(params.total_urls * (1 - projectedRate / 100)) : 0,
          confidence: 70,
          timeline_months: months,
        };
      }
      case 'error_reduction': {
        const currentErrors = params.current_errors || 100;
        const fixRate = params.fix_rate || 0.2;
        const projectedErrors = Math.round(currentErrors * Math.pow(1 - fixRate, months));
        return {
          current_errors: currentErrors,
          projected_errors: projectedErrors,
          errors_fixed: currentErrors - projectedErrors,
          estimated_crawl_budget_improvement: Math.round((1 - projectedErrors / Math.max(currentErrors, 1)) * 100),
          confidence: 65,
          timeline_months: months,
        };
      }
      case 'traffic_projection': {
        const currentTraffic = params.current_traffic || 10000;
        const monthlyGrowth = params.monthly_growth_pct || 5;
        const projectedTraffic = Math.round(currentTraffic * Math.pow(1 + monthlyGrowth / 100, months));
        const projectedRevenue = params.revenue_per_visit
          ? Math.round(projectedTraffic * params.revenue_per_visit)
          : undefined;
        return {
          current_traffic: currentTraffic,
          projected_traffic: projectedTraffic,
          traffic_growth_pct: Math.round(((projectedTraffic - currentTraffic) / currentTraffic) * 100),
          projected_revenue: projectedRevenue,
          confidence: 60,
          timeline_months: months,
        };
      }
      case 'revenue_model': {
        const currentMRR = params.current_mrr || 0;
        const growthRate = params.monthly_growth_pct || 10;
        const projectedMRR = Math.round(currentMRR * Math.pow(1 + growthRate / 100, months));
        return {
          current_mrr: currentMRR,
          projected_mrr: projectedMRR,
          projected_arr: projectedMRR * 12,
          mrr_growth_pct: Math.round(((projectedMRR - currentMRR) / Math.max(currentMRR, 1)) * 100),
          confidence: 55,
          timeline_months: months,
        };
      }
      default:
        return {
          scenario: scenarioType,
          params,
          horizon_months: months,
          confidence: 50,
          note: 'Custom scenario - limited prediction accuracy',
        };
    }
  }
}