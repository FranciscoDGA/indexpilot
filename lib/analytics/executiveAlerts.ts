import { createClient } from '@/lib/supabase/server';
import type { ExecutiveAlert, AnalyticsAlertSeverity, AlertType } from '@/types/analytics';

export class ExecutiveAlerts {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createAlert(params: {
    tenantId: string;
    alertType: AlertType;
    severity: AnalyticsAlertSeverity;
    title: string;
    description?: string;
    metricKey?: string;
    currentValue?: number;
    previousValue?: number;
    changePct?: number;
    anomalyScore?: number;
    rootCause?: string;
    recommendedActions?: string[];
    affectedSites?: string[];
    metadata?: Record<string, any>;
  }): Promise<ExecutiveAlert> {
    const { data, error } = await this.supabase
      .from('executive_alerts')
      .insert({
        tenant_id: params.tenantId,
        alert_type: params.alertType,
        severity: params.severity,
        title: params.title,
        description: params.description,
        metric_key: params.metricKey,
        current_value: params.currentValue,
        previous_value: params.previousValue,
        change_pct: params.changePct,
        anomaly_score: params.anomalyScore || 0,
        root_cause: params.rootCause,
        recommended_actions: params.recommendedActions || [],
        affected_sites: params.affectedSites || [],
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as ExecutiveAlert;
  }

  async getAlerts(tenantId: string, options?: {
    severity?: AnalyticsAlertSeverity;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ExecutiveAlert[]> {
    let query = this.supabase
      .from('executive_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (options?.severity) query = query.eq('severity', options.severity);
    if (options?.unreadOnly) query = query.eq('is_read', false);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ExecutiveAlert[];
  }

  async getAlertStats(tenantId: string): Promise<{
    total: number;
    unread: number;
    critical: number;
    warning: number;
    info: number;
    resolved_today: number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: all } = await this.supabase
      .from('executive_alerts')
      .select('severity, is_read, resolved_at')
      .eq('tenant_id', tenantId);

    const alerts = (all || []) as { severity: string; is_read: boolean; resolved_at: string | null }[];

    return {
      total: alerts.length,
      unread: alerts.filter(a => !a.is_read).length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      resolved_today: alerts.filter(a => a.resolved_at && new Date(a.resolved_at) >= todayStart).length,
    };
  }

  async markAsRead(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('executive_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) throw error;
  }

  async markAllAsRead(tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('executive_alerts')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (error) throw error;
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from('executive_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async runAnomalyDetection(tenantId: string): Promise<ExecutiveAlert[]> {
    const alerts: ExecutiveAlert[] = [];

    const metrics = ['seo_score', 'indexed_urls', 'mrr', 'uptime_pct', 'organic_traffic'];

    for (const metricKey of metrics) {
      const { data } = await this.supabase
        .from('executive_metrics')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('metric_key', metricKey)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!data || data.length < 7) continue;

      const values = data.map((d: any) => d.metric_value);
      const recent = values.slice(0, 7);
      const historical = values.slice(7);

      if (historical.length === 0) continue;

      const histAvg = historical.reduce((s: number, v: number) => s + v, 0) / historical.length;
      const histStd = Math.sqrt(historical.reduce((s: number, v: number) => s + Math.pow(v - histAvg, 2), 0) / historical.length);
      const recentAvg = recent.reduce((s: number, v: number) => s + v, 0) / recent.length;

      const zScore = histStd > 0 ? (recentAvg - histAvg) / histStd : 0;

      if (Math.abs(zScore) > 2) {
        const direction = zScore > 0 ? 'increase' : 'decrease';
        const changePct = histAvg > 0 ? Math.round(((recentAvg - histAvg) / histAvg) * 100) : 0;

        const alert = await this.createAlert({
          tenantId,
          alertType: 'trend_anomaly',
          severity: Math.abs(zScore) > 3 ? 'critical' : 'warning',
          title: `Anomalous ${direction} in ${metricKey}`,
          description: `Detected ${Math.abs(changePct)}% ${direction} in ${metricKey} over the last 7 days compared to historical average`,
          metricKey,
          currentValue: recentAvg,
          previousValue: histAvg,
          changePct,
          anomalyScore: Math.abs(zScore),
          rootCause: `Statistical anomaly detected (z-score: ${zScore.toFixed(2)})`,
          recommendedActions: [
            `Investigate recent changes to ${metricKey}`,
            'Check for external factors affecting this metric',
            'Review correlated metrics for root cause',
          ],
          metadata: { zScore, window: 7 },
        });

        alerts.push(alert);
      }
    }

    return alerts;
  }
}