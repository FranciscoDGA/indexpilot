import { createClient } from '@/lib/supabase/server';
import type { SecuritySession, SecurityAlert, SecurityAlertType, AlertSeverity } from '@/types/enterprise';

export class SecurityCenter {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async getActiveSessions(userId: string): Promise<SecuritySession[]> {
    const { data, error } = await this.supabase
      .from('security_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('last_active_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createSession(params: {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, any>;
  }): Promise<SecuritySession> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('security_sessions')
      .insert({
        user_id: params.userId,
        tenant_id: params.tenantId,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        device_info: params.deviceInfo || {},
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('security_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    let query = this.supabase
      .from('security_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (exceptSessionId) {
      query = query.neq('id', exceptSessionId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async createAlert(params: {
    tenantId: string;
    userId?: string;
    alertType: SecurityAlertType;
    severity?: AlertSeverity;
    details?: Record<string, any>;
  }): Promise<SecurityAlert> {
    const { data, error } = await this.supabase
      .from('security_alerts')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        alert_type: params.alertType,
        severity: params.severity || 'medium',
        details: params.details || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAlerts(
    tenantId: string,
    options: { resolved?: boolean; limit?: number } = {}
  ): Promise<SecurityAlert[]> {
    let query = this.supabase
      .from('security_alerts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (options.resolved !== undefined) {
      query = query.eq('resolved', options.resolved);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async detectSuspiciousActivity(userId: string, ipAddress: string): Promise<boolean> {
    // Check for multiple failed login attempts
    const { data: recentAlerts } = await this.supabase
      .from('security_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('alert_type', 'login_suspicious')
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if ((recentAlerts?.length || 0) >= 3) {
      await this.createAlert({
        tenantId: '',
        userId,
        alertType: 'brute_force',
        severity: 'high',
        details: { ip_address: ipAddress, attempts: recentAlerts?.length },
      });
      return true;
    }

    return false;
  }

  async getSecurityStats(tenantId: string): Promise<{
    active_sessions: number;
    unresolved_alerts: number;
    recent_logins: number;
    api_keys_count: number;
  }> {
    const [sessions, alerts, logins, apiKeys] = await Promise.all([
      this.supabase
        .from('security_sessions')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString()),
      this.supabase
        .from('security_alerts')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('resolved', false),
      this.supabase
        .from('audit_logs')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('action', 'login')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      this.supabase
        .from('api_keys')
        .select('id', { count: 'exact' })
        .eq('active', true),
    ]);

    return {
      active_sessions: sessions.count || 0,
      unresolved_alerts: alerts.count || 0,
      recent_logins: logins.count || 0,
      api_keys_count: apiKeys.count || 0,
    };
  }
}