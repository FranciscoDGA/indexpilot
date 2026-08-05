import { createClient } from '@/lib/supabase/server';
import type { Subscription, SubscriptionStatus, TrialInfo } from '@/types/billing';

export class SubscriptionEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async getSubscription(tenantId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  async createSubscription(params: {
    tenantId: string;
    planId: string;
    billingCycle?: 'monthly' | 'yearly';
    trialDays?: number;
    paymentMethodId?: string;
  }): Promise<Subscription> {
    const now = new Date();
    const trialEndsAt = params.trialDays
      ? new Date(now.getTime() + params.trialDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert({
        tenant_id: params.tenantId,
        plan_id: params.planId,
        status: params.trialDays ? 'trial' : 'active',
        billing_cycle: params.billingCycle || 'monthly',
        trial_started_at: params.trialDays ? now.toISOString() : undefined,
        trial_ends_at: trialEndsAt,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: currentPeriodEnd,
        renewal_at: currentPeriodEnd,
        payment_method_id: params.paymentMethodId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      status: cancelAtPeriodEnd ? 'active' : 'cancelled',
      cancel_at_period_end: cancelAtPeriodEnd,
      cancelled_at: new Date().toISOString(),
    });
  }

  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      status: 'active',
      cancel_at_period_end: false,
      cancelled_at: undefined,
    });
  }

  async upgradePlan(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      plan_id: newPlanId,
      status: 'active',
    });
  }

  async getTrialInfo(tenantId: string): Promise<TrialInfo> {
    const subscription = await this.getSubscription(tenantId);

    if (!subscription || subscription.status !== 'trial') {
      return {
        is_trial: false,
        days_remaining: 0,
        features_available: [],
        features_locked: [],
      };
    }

    const trialEndsAt = new Date(subscription.trial_ends_at!);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      is_trial: true,
      trial_ends_at: subscription.trial_ends_at,
      days_remaining: daysRemaining,
      features_available: ['basic_seo', 'auto_indexing', 'basic_ai', 'monitoring'],
      features_locked: ['competitor_intel', 'white_label', 'full_api', 'teams'],
    };
  }

  async checkSubscriptionLimits(tenantId: string): Promise<{
    is_within_limits: boolean;
    warnings: string[];
    blocked: boolean;
  }> {
    const subscription = await this.getSubscription(tenantId);
    const warnings: string[] = [];
    let blocked = false;

    if (!subscription || subscription.status === 'cancelled' || subscription.status === 'expired') {
      return { is_within_limits: false, warnings: ['No active subscription'], blocked: true };
    }

    if (subscription.status === 'trial') {
      const trialInfo = await this.getTrialInfo(tenantId);
      if (trialInfo.days_remaining <= 3) {
        warnings.push(`Trial ending in ${trialInfo.days_remaining} days`);
      }
    }

    if (subscription.status === 'past_due') {
      warnings.push('Payment past due');
      blocked = true;
    }

    return {
      is_within_limits: true,
      warnings,
      blocked,
    };
  }

  async getUpcomingInvoice(tenantId: string): Promise<any> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return null;

    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }
}