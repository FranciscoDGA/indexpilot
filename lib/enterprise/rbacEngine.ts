import { createClient } from '@/lib/supabase/server';
import type { Role, Permission, UserRole, SystemRole } from '@/types/enterprise';

export class RBACEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('*, roles(*)')
      .eq('user_id', userId)
      .eq('roles.tenant_id', tenantId);

    if (error) throw error;
    return (data || []).map((ur: any) => ur.roles).filter(Boolean);
  }

  async getUserPermissions(userId: string, tenantId: string, workspaceId?: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId, tenantId);
    const allPermissions: Permission[] = [];

    for (const role of roles) {
      allPermissions.push(...role.permissions);
    }

    return this.mergePermissions(allPermissions);
  }

  async hasPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    workspaceId?: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId, workspaceId);

    // Check for wildcard permission
    if (permissions.some(p => p.resource === '*' && p.actions.includes('manage'))) {
      return true;
    }

    // Check for specific permission
    return permissions.some(
      p => p.resource === resource && (p.actions.includes(action as any) || p.actions.includes('manage'))
    );
  }

  async assignRole(userId: string, roleId: string, workspaceId?: string, grantedBy?: string): Promise<UserRole> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        workspace_id: workspaceId,
        granted_by: grantedBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async revokeRole(userId: string, roleId: string, workspaceId?: string): Promise<void> {
    let query = this.supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  async createRole(tenantId: string, role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .insert({ ...role, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRole(roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('is_system', false);

    if (error) throw error;
  }

  async listRoles(tenantId: string): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  private mergePermissions(permissions: Permission[]): Permission[] {
    const merged = new Map<string, Set<string>>();

    for (const perm of permissions) {
      const existing = merged.get(perm.resource) || new Set();
      for (const action of perm.actions) {
        existing.add(action);
      }
      merged.set(perm.resource, existing);
    }

    return Array.from(merged.entries()).map(([resource, actions]) => ({
      resource,
      actions: Array.from(actions) as any[],
    }));
  }
}