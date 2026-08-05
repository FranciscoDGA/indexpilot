import { createClient } from '@/lib/supabase/server';
import { DecisionEngine } from './decisionEngine';
import { GoalEngine } from './goalEngine';
import { LearningEngine } from './learningEngine';
import type { MissionControlDashboard, AIDecision, AIGoal, AIRecommendation } from '@/types/aiops';

export class MissionControl {
  private supabase: ReturnType<typeof createClient>;
  private decisionEngine: DecisionEngine;
  private goalEngine: GoalEngine;
  private learningEngine: LearningEngine;

  constructor() {
    this.supabase = createClient();
    this.decisionEngine = new DecisionEngine();
    this.goalEngine = new GoalEngine();
    this.learningEngine = new LearningEngine();
  }

  async getDashboard(tenantId: string): Promise<MissionControlDashboard> {
    const [decisions, goals, strategies, recommendations, memoryStats] = await Promise.all([
      this.decisionEngine.getDecisions(tenantId, { limit: 10 }),
      this.goalEngine.getGoals(tenantId),
      this.supabase.from('ai_strategies').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
      this.supabase.from('ai_recommendations').select('*').eq('tenant_id', tenantId).eq('status', 'active').order('impact_score', { ascending: false }).limit(5),
      this.learningEngine.getMemoryStats(tenantId),
    ]);

    const strategiesData = (strategies.data || []) as any[];
    const recommendationsData = (recommendations.data || []) as any[];

    // Get alert counts
    const { data: alertData } = await this.supabase
      .from('executive_alerts')
      .select('severity')
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    const alerts = (alertData || []) as { severity: string }[];

    // Build mission statement
    const pendingDecisions = decisions.filter(d => d.status === 'pending');
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const goalsAtRisk = goals.filter(g => g.status === 'active' && g.deadline && new Date(g.deadline) < new Date() && g.progress_pct < 100);

    let mission = 'All systems operational. No urgent actions required.';
    if (criticalAlerts.length > 0) {
      mission = `${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's' : ''} require immediate attention.`;
    } else if (pendingDecisions.length > 0) {
      mission = `${pendingDecisions.length} decision${pendingDecisions.length > 1 ? 's' : ''} awaiting approval.`;
    } else if (goalsAtRisk.length > 0) {
      mission = `${goalsAtRisk.length} goal${goalsAtRisk.length > 1 ? 's' : ''} at risk of missing deadline.`;
    }

    // Risk areas
    const riskAreas: { module: string; severity: string; description: string }[] = [];
    if (criticalAlerts.length > 0) riskAreas.push({ module: 'monitoring', severity: 'critical', description: `${criticalAlerts.length} critical alerts` });
    if (goalsAtRisk.length > 0) riskAreas.push({ module: 'goals', severity: 'warning', description: `${goalsAtRisk.length} goals at risk` });

    // Opportunities
    const opportunities = recommendationsData.slice(0, 5).map((r: any) => ({
      title: r.title,
      impact: r.impact_score,
      effort: r.effort_level,
    }));

    return {
      tenant_id: tenantId,
      generated_at: new Date().toISOString(),
      mission_today: mission,
      priorities: pendingDecisions.slice(0, 5),
      active_strategies: strategiesData.filter((s: any) => ['approved', 'executing'].includes(s.status)).slice(0, 5),
      goals_progress: goals.filter(g => g.status === 'active').slice(0, 8),
      recent_recommendations: recommendationsData.slice(0, 5),
      alerts_summary: {
        critical: criticalAlerts.length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
      },
      metrics_snapshot: {},
      automation_savings: {
        time_saved_hours: memoryStats.positive_outcomes * 2.5,
        tasks_automated: memoryStats.total_memories,
        cost_saved_usd: memoryStats.positive_outcomes * 15,
      },
      risk_areas: riskAreas,
      opportunities,
    };
  }

  async getMissionBriefing(tenantId: string): Promise<string> {
    const dashboard = await this.getDashboard(tenantId);
    const lines: string[] = [];

    lines.push(`Mission: ${dashboard.mission_today}`);
    lines.push('');

    if (dashboard.priorities.length > 0) {
      lines.push('Top Priorities:');
      for (const p of dashboard.priorities.slice(0, 3)) {
        lines.push(`  - [${p.urgency}] ${p.title} (confidence: ${p.confidence}%)`);
      }
      lines.push('');
    }

    if (dashboard.goals_progress.length > 0) {
      lines.push('Goals Progress:');
      for (const g of dashboard.goals_progress.slice(0, 3)) {
        lines.push(`  - ${g.title}: ${g.progress_pct}%`);
      }
      lines.push('');
    }

    if (dashboard.risk_areas.length > 0) {
      lines.push('Risk Areas:');
      for (const r of dashboard.risk_areas) {
        lines.push(`  - [${r.severity}] ${r.module}: ${r.description}`);
      }
      lines.push('');
    }

    if (dashboard.opportunities.length > 0) {
      lines.push('Opportunities:');
      for (const o of dashboard.opportunities.slice(0, 3)) {
        lines.push(`  - ${o.title} (impact: ${o.impact}, effort: ${o.effort})`);
      }
    }

    return lines.join('\n');
  }
}