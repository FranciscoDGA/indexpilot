import { createClient } from '@/lib/supabase/server';
import type { Plan, PlanLimits } from '@/types/billing';

export class PlansManager {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async listPlans(): Promise<Plan[]> {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getPlan(id: string): Promise<Plan | null> {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getPlanBySlug(slug: string): Promise<Plan | null> {
    const { data, error } = await this.supabase
      .from('plans')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  async createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    const { data, error } = await this.supabase
      .from('plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlan(id: string, updates: Partial<Plan>): Promise<Plan> {
    const { data, error } = await this.supabase
      .from('plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDefaultPlans(): Promise<Plan[]> {
    return [
      {
        id: 'plan-free',
        name: 'Free',
        slug: 'free',
        description: 'Para quem está começando',
        price_monthly: 0,
        price_yearly: 0,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: { basic_seo: true, manual_indexing: true },
        limits: { max_sites: 1, max_urls: 200, max_users: 1 },
        is_active: true,
        is_popular: false,
        trial_days: 0,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'plan-starter',
        name: 'Starter',
        slug: 'starter',
        description: 'Para projetos pequenos',
        price_monthly: 29,
        price_yearly: 290,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: { basic_seo: true, auto_indexing: true, basic_ai: true },
        limits: { max_sites: 5, max_urls: 10000, max_users: 3, max_ai_queries_monthly: 100 },
        is_active: true,
        is_popular: false,
        trial_days: 14,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'plan-pro',
        name: 'Pro',
        slug: 'pro',
        description: 'Para profissionais de SEO',
        price_monthly: 99,
        price_yearly: 990,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: { full_seo: true, auto_indexing: true, full_ai: true, competitor_intel: true, monitoring: true },
        limits: { max_sites: 50, max_urls: 250000, max_users: 10, max_competitors: 20, max_monitoring_urls: 100, max_ai_queries_monthly: 1000 },
        is_active: true,
        is_popular: true,
        trial_days: 14,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'plan-agency',
        name: 'Agency',
        slug: 'agency',
        description: 'Para agências e equipes',
        price_monthly: 299,
        price_yearly: 2990,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: { white_label: true, multi_workspace: true, full_api: true, teams: true },
        limits: { max_sites: 200, max_urls: 1000000, max_users: 50, max_competitors: 100, max_monitoring_urls: 500, max_ai_queries_monthly: 5000 },
        is_active: true,
        is_popular: false,
        trial_days: 14,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'plan-enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Para grandes empresas',
        price_monthly: 999,
        price_yearly: 9990,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: { custom: true, sla: true, dedicated_support: true },
        limits: { max_sites: 999, max_urls: 9999999, max_users: 999, max_competitors: 999, max_monitoring_urls: 9999, max_ai_queries_monthly: 99999 },
        is_active: true,
        is_popular: false,
        trial_days: 30,
        sort_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}