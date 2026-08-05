import { createClient } from '@/lib/supabase/server';
import type { Coupon, CouponType } from '@/types/billing';

export class CouponManager {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async validateCoupon(code: string, tenantId?: string, planId?: string): Promise<{
    valid: boolean;
    coupon?: Coupon;
    error?: string;
  }> {
    const { data: coupon, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, error: 'Coupon expired' };
    }

    // Check max uses
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Check if first payment only
    if (coupon.first_payment_only && tenantId) {
      const { count } = await this.supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'succeeded');

      if ((count || 0) > 0) {
        return { valid: false, error: 'Coupon valid for first payment only' };
      }
    }

    // Check plan restriction
    if (coupon.applies_to_plans && coupon.applies_to_plans.length > 0 && planId) {
      if (!coupon.applies_to_plans.includes(planId)) {
        return { valid: false, error: 'Coupon not valid for this plan' };
      }
    }

    return { valid: true, coupon };
  }

  async calculateDiscount(coupon: Coupon, amount: number): Promise<number> {
    switch (coupon.type) {
      case 'percentage':
        return Math.min(amount, amount * (coupon.value / 100));
      case 'fixed_amount':
        return Math.min(amount, coupon.value);
      case 'trial_extension':
        return 0; // Handled separately
      case 'free_upgrade':
        return 0; // Handled separately
      default:
        return 0;
    }
  }

  async listCoupons(): Promise<Coupon[]> {
    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createCoupon(coupon: Omit<Coupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>): Promise<Coupon> {
    const { data, error } = await this.supabase
      .from('coupons')
      .insert({
        ...coupon,
        code: coupon.code.toUpperCase(),
        used_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await this.supabase
      .from('coupons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deactivateCoupon(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('coupons')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async getCouponUsage(couponId: string): Promise<{
    total_uses: number;
    total_discount: number;
    recent_uses: any[];
  }> {
    const { data: usage, error } = await this.supabase
      .from('coupon_usage')
      .select('*')
      .eq('coupon_id', couponId)
      .order('used_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const totalUses = usage?.length || 0;
    const totalDiscount = usage?.reduce((sum: number, u: any) => sum + u.discount_amount, 0) || 0;

    return {
      total_uses: totalUses,
      total_discount: totalDiscount,
      recent_uses: usage || [],
    };
  }
}