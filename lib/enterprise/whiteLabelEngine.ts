import { createClient } from '@/lib/supabase/server';
import type { WhiteLabelConfig, DomainMapping } from '@/types/enterprise';

export class WhiteLabelEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async getConfig(tenantId: string): Promise<WhiteLabelConfig | null> {
    const { data, error } = await this.supabase
      .from('white_label_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;
    return data;
  }

  async updateConfig(tenantId: string, updates: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> {
    const existing = await this.getConfig(tenantId);

    if (existing) {
      const { data, error } = await this.supabase
        .from('white_label_configs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await this.supabase
        .from('white_label_configs')
        .insert({ tenant_id: tenantId, ...updates })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  async setCustomDomain(tenantId: string, domain: string): Promise<DomainMapping> {
    // Check if domain already exists
    const { data: existing } = await this.supabase
      .from('domain_mappings')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existing) {
      throw new Error('Domain already in use');
    }

    const { data, error } = await this.supabase
      .from('domain_mappings')
      .insert({
        tenant_id: tenantId,
        domain,
        ssl_status: 'pending',
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Update white label config
    await this.updateConfig(tenantId, { custom_domain: domain });

    return data;
  }

  async getDomainMappings(tenantId: string): Promise<DomainMapping[]> {
    const { data, error } = await this.supabase
      .from('domain_mappings')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  async verifyDomain(domain: string): Promise<boolean> {
    // In production, this would verify DNS records
    const { error } = await this.supabase
      .from('domain_mappings')
      .update({ verified: true, ssl_status: 'active' })
      .eq('domain', domain);

    return !error;
  }

  async getBrandingForDomain(domain: string): Promise<WhiteLabelConfig | null> {
    const { data: mapping } = await this.supabase
      .from('domain_mappings')
      .select('tenant_id')
      .eq('domain', domain)
      .eq('verified', true)
      .single();

    if (!mapping) return null;

    return this.getConfig(mapping.tenant_id);
  }

  async generatePDFBranding(tenantId: string): Promise<{
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    platform_name: string;
  }> {
    const config = await this.getConfig(tenantId);

    return {
      logo_url: config?.logo_url,
      primary_color: config?.primary_color || '#3B82F6',
      secondary_color: config?.secondary_color || '#10B981',
      platform_name: config?.platform_name || 'IndexPilot',
    };
  }
}