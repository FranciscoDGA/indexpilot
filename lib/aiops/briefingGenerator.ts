import { createClient } from '@/lib/supabase/server';
import type { AIBriefing, BriefingHighlight, BriefingAlert, BriefingRecommendation } from '@/types/aiops';

export class BriefingGenerator {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async generateBriefing(tenantId: string, date?: string): Promise<AIBriefing> {
    const briefingDate = date || new Date().toISOString().split('T')[0];

    // Gather data from multiple sources
    const [decisions, goals, recommendations, alerts, memory] = await Promise.all([
      this.supabase.from('ai_decisions').select('*').eq('tenant_id', tenantId).gte('created_at', `${briefingDate}T00:00:00`).limit(20),
      this.supabase.from('ai_goals').select('*').eq('tenant_id', tenantId).eq('status', 'active'),
      this.supabase.from('ai_recommendations').select('*').eq('tenant_id', tenantId).eq('status', 'active').order('impact_score', { ascending: false }).limit(5),
      this.supabase.from('executive_alerts').select('*').eq('tenant_id', tenantId).eq('is_read', false).order('created_at', { ascending: false }).limit(10),
      this.supabase.from('ai_memory').select('*').eq('tenant_id', tenantId).gte('created_at', `${briefingDate}T00:00:00`).limit(10),
    ]);

    const decisionsData = (decisions.data || []) as any[];
    const goalsData = (goals.data || []) as any[];
    const recommendationsData = (recommendations.data || []) as any[];
    const alertsData = (alerts.data || []) as any[];
    const memoryData = (memory.data || []) as any[];

    // Build highlights
    const highlights: BriefingHighlight[] = [];
    if (decisionsData.length > 0) {
      highlights.push({ icon: 'brain', text: `${decisionsData.length} AI decisions made today`, module: 'aiops' });
    }
    if (memoryData.filter((m: any) => m.outcome === 'positive').length > 0) {
      highlights.push({ icon: 'check', text: `${memoryData.filter((m: any) => m.outcome === 'positive').length} successful actions`, module: 'aiops' });
    }
    const pendingDecisions = decisionsData.filter((d: any) => d.status === 'pending');
    if (pendingDecisions.length > 0) {
      highlights.push({ icon: 'clock', text: `${pendingDecisions.length} decisions awaiting approval`, module: 'aiops' });
    }

    // Build alerts
    const briefingAlerts: BriefingAlert[] = alertsData.slice(0, 5).map((a: any) => ({
      severity: a.severity,
      title: a.title,
      description: a.description || '',
    }));

    // Build recommendations
    const briefingRecommendations: BriefingRecommendation[] = recommendationsData.map((r: any) => ({
      title: r.title,
      impact: `${r.impact_score}/10`,
      effort: r.effort_level,
    }));

    // Goals progress
    const goalsProgress = goalsData.map((g: any) => ({
      goal_id: g.id,
      title: g.title,
      progress_pct: g.progress_pct,
    }));

    // Metrics summary
    const metricsSummary = {
      decisions_today: decisionsData.length,
      decisions_pending: pendingDecisions.length,
      goals_active: goalsData.length,
      goals_avg_progress: goalsData.length > 0 ? Math.round(goalsData.reduce((s: number, g: any) => s + g.progress_pct, 0) / goalsData.length) : 0,
      recommendations_active: recommendationsData.length,
      alerts_unread: alertsData.length,
      actions_today: memoryData.length,
    };

    // Generate summary
    const summary = this.generateSummaryText(metricsSummary, briefingAlerts, briefingRecommendations);

    // Create briefing
    const { data, error } = await this.supabase
      .from('ai_briefings')
      .insert({
        tenant_id: tenantId,
        title: `Daily Briefing — ${briefingDate}`,
        summary,
        highlights,
        alerts: briefingAlerts,
        recommendations: briefingRecommendations,
        metrics_summary: metricsSummary,
        goals_progress: goalsProgress,
        period: 'daily',
        date: briefingDate,
        sent_via: 'dashboard',
      })
      .select()
      .single();

    if (error) throw error;
    return data as AIBriefing;
  }

  async getBriefings(tenantId: string, limit: number = 30): Promise<AIBriefing[]> {
    const { data, error } = await this.supabase
      .from('ai_briefings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AIBriefing[];
  }

  async getLatestBriefing(tenantId: string): Promise<AIBriefing | null> {
    const { data, error } = await this.supabase
      .from('ai_briefings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data as AIBriefing;
  }

  async markAsSent(briefingId: string, channel: 'email' | 'dashboard' | 'both'): Promise<void> {
    const { error } = await this.supabase
      .from('ai_briefings')
      .update({ sent_via: channel, sent_at: new Date().toISOString() })
      .eq('id', briefingId);

    if (error) throw error;
  }

  private generateSummaryText(
    metrics: Record<string, any>,
    alerts: BriefingAlert[],
    recommendations: BriefingRecommendation[]
  ): string {
    const lines: string[] = [];

    lines.push('Daily operations summary:');
    lines.push('');

    if (metrics.decisions_today > 0) {
      lines.push(`• ${metrics.decisions_today} AI decisions processed`);
    }
    if (metrics.decisions_pending > 0) {
      lines.push(`• ${metrics.decisions_pending} decisions awaiting your approval`);
    }
    if (metrics.goals_active > 0) {
      lines.push(`• ${metrics.goals_active} active goals (avg progress: ${metrics.goals_avg_progress}%)`);
    }
    if (metrics.recommendations_active > 0) {
      lines.push(`• ${metrics.recommendations_active} optimization recommendations`);
    }
    if (alerts.length > 0) {
      const critical = alerts.filter(a => a.severity === 'critical').length;
      const warnings = alerts.filter(a => a.severity === 'warning').length;
      if (critical > 0) lines.push(`• ${critical} critical alerts requiring attention`);
      if (warnings > 0) lines.push(`• ${warnings} warnings to review`);
    }
    if (metrics.actions_today > 0) {
      lines.push(`• ${metrics.actions_today} automated actions executed`);
    }

    if (recommendations.length > 0) {
      lines.push('');
      lines.push('Top recommendation:');
      lines.push(`  ${recommendations[0].title} (impact: ${recommendations[0].impact})`);
    }

    return lines.join('\n');
  }
}