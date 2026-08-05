import { createClient } from '@/lib/supabase/server';
import type { Tenant, TenantLimits, TenantPlan, TenantStatus } from '@/types/enterprise';

export class TenantManager {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createTenant(data: {
    name: string;
    slug: string;
    plan?: TenantPlan;
  }): Promise<Tenant> {
    const limits = this.getDefaultLimits(data.plan || 'free');

    const { data: tenant, error } = await this.supabase
      .from('tenants')
      .insert({
        name: data.name,
        slug: data.slug,
        plan: data.plan || 'free',
        status: 'active',
        limits,
        settings: {},
      })
      .select()
      .single();

    if (error) throw error;

    // Create default workspace
    await this.supabase.from('workspaces').insert({
      tenant_id: tenant.id,
      name: 'Default Workspace',
      slug: 'default',
    });

    // Create default roles
    await this.createDefaultRoles(tenant.id);

    // Create white label defaults
    await this.supabase.from('white_label_configs').insert({
      tenant_id: tenant.id,
      platform_name: 'IndexPilot',
    });

    return tenant;
  }

  async getTenant(id: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listTenants(limit: number = 50): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getTenantLimits(tenantId: string): Promise<TenantLimits> {
    const tenant = await this.getTenant(tenantId);
    return tenant?.limits || {};
  }

  async checkLimits(tenantId: string, resource: string, currentCount: number): Promise<boolean> {
    const limits = await this.getTenantLimits(tenantId);

    switch (resource) {
      case 'sites':
        return !limits.max_sites || currentCount < limits.max_sites;
      case 'urls':
        return !limits.max_urls || currentCount < limits.max_urls;
      case 'users':
        return !limits.max_users || currentCount < limits.max_users;
      default:
        return true;
    }
  }

  private getDefaultLimits(plan: TenantPlan): TenantLimits {
    const limits: Record<TenantPlan, TenantLimits> = {
      free: { max_sites: 3, max_urls: 500, max_users: 2, max_crawls_concurrent: 1 },
      pro: { max_sites: 50, max_urls: 100000, max_users: 20, max_crawls_concurrent: 10 },
      enterprise: { max_sites: 999, max_urls: 999999, max_users: 999, max_crawls_concurrent: 50 },
      custom: { max_sites: 999, max_urls: 999999, max_users: 999, max_crawls_concurrent: 100 },
    };
    return limits[plan];
  }

  private async createDefaultRoles(tenantId: string): Promise<void> {
    const defaultRoles = [
      {
        tenant_id: tenantId,
        name: 'Tenant Admin',
        description: 'Full access to tenant settings and all workspaces',
        permissions: [{ resource: '*', actions: ['manage'] }],
        is_system: true,
      },
      {
        tenant_id: tenantId,
        name: 'Manager',
        description: 'Manage workspaces and team members',
        permissions: [
          { resource: 'workspaces', actions: ['read', 'update'] },
          { resource: 'users', actions: ['read', 'invite'] },
          { resource: 'sites', actions: ['manage'] },
          { resource: 'reports', actions: ['read', 'export'] },
        ],
        is_system: true,
      },
      {
        tenant_id: tenantId,
        name: 'SEO Specialist',
        description: 'Full access to SEO features',
        permissions: [
          { resource: 'sites', actions: ['read', 'update'] },
          { resource: 'urls', actions: ['manage'] },
          { resource: 'audits', actions: ['manage'] },
          { resource: 'monitoring', actions: ['manage'] },
          { resource: 'competitors', actions: ['manage'] },
          { resource: 'reports', actions: ['read'] },
        ],
        is_system: true,
      },
      {
        tenant_id: tenantId,
        name: 'Editor',
        description: 'Create and edit content',
        permissions: [
          { resource: 'sites', actions: ['read'] },
          { resource: 'urls', actions: ['create', 'read', 'update'] },
          { resource: 'publications', actions: ['create', 'read'] },
        ],
        is_system: true,
      },
      {
        tenant_id: tenantId,
        name: 'Viewer',
        description: 'Read-only access',
        permissions: [
          { resource: 'sites', actions: ['read'] },
          { resource: 'reports', actions: ['read'] },
          { resource: 'dashboard', actions: ['read'] },
        ],
        is_system: true,
      },
    ];

    await this.supabase.from('roles').insert(defaultRoles);
  }
}