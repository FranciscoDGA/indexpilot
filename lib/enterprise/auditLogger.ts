import { createClient } from '@/lib/supabase/server';
import type { AuditLog, AuditAction } from '@/types/enterprise';

export class AuditLogger {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async log(params: {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        details: params.details || {},
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLogs(
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      action?: AuditAction;
      resourceType?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    let query = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (options.action) {
      query = query.eq('action', options.action);
    }
    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  async getRecentActivity(tenantId: string, limit: number = 10): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getAuditStats(tenantId: string, days: number = 30): Promise<{
    total_actions: number;
    actions_by_type: Record<string, number>;
    active_users: number;
    recent_security_events: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await this.supabase
      .from('audit_logs')
      .select('action, user_id')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate);

    if (error) throw error;

    const logsList = logs || [];
    const actionsByType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    let securityEvents = 0;

    for (const log of logsList) {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      if (log.user_id) uniqueUsers.add(log.user_id);
      if (log.action.startsWith('login') || log.action.includes('security') || log.action.includes('password')) {
        securityEvents++;
      }
    }

    return {
      total_actions: logsList.length,
      actions_by_type: actionsByType,
      active_users: uniqueUsers.size,
      recent_security_events: securityEvents,
    };
  }
}