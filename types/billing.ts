// ============================================================================
// SPRINT 17: BILLING, SUBSCRIPTION & USAGE MANAGEMENT TYPES
// ============================================================================

// --- Plans ---
export type BillingCycle = 'monthly' | 'yearly' | 'one_time';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'paused';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  billing_cycle: BillingCycle;
  features: Record<string, any>;
  limits: PlanLimits;
  is_active: boolean;
  is_popular: boolean;
  trial_days: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  max_sites?: number;
  max_urls?: number;
  max_users?: number;
  max_crawls_concurrent?: number;
  max_api_calls_monthly?: number;
  max_storage_gb?: number;
  max_competitors?: number;
  max_monitoring_urls?: number;
  max_ai_queries_monthly?: number;
  features?: string[];
}

// --- Subscriptions ---
export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: 'monthly' | 'yearly';
  trial_started_at?: string;
  trial_ends_at?: string;
  started_at: string;
  current_period_start: string;
  current_period_end?: string;
  renewal_at?: string;
  cancelled_at?: string;
  cancel_at_period_end: boolean;
  payment_method_id?: string;
  external_subscription_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Usage Records ---
export type UsageResource = 'urls' | 'crawls' | 'indexations' | 'ai_queries' | 'api_calls' | 'storage_gb' | 'users' | 'competitors' | 'monitoring';

export interface UsageRecord {
  id: string;
  tenant_id: string;
  subscription_id?: string;
  resource: UsageResource;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  period_start?: string;
  period_end?: string;
  recorded_at: string;
  metadata: Record<string, any>;
}

export interface UsageSummary {
  resource: UsageResource;
  used: number;
  limit: number;
  percentage: number;
  cost: number;
}

// --- Invoices ---
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type BillingReason = 'subscription_create' | 'subscription_cycle' | 'subscription_update' | 'manual';

export interface Invoice {
  id: string;
  tenant_id: string;
  subscription_id?: string;
  invoice_number: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  due_date?: string;
  paid_at?: string;
  period_start?: string;
  period_end?: string;
  billing_reason?: BillingReason;
  line_items: InvoiceLineItem[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  period?: { start: string; end: string };
}

// --- Payments ---
export type PaymentProvider = 'stripe' | 'mercadopago' | 'paypal' | 'manual';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  provider: PaymentProvider;
  transaction_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  payment_method_last4?: string;
  payment_method_brand?: string;
  refund_amount: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Coupons ---
export type CouponType = 'percentage' | 'fixed_amount' | 'trial_extension' | 'free_upgrade';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  currency: string;
  max_uses?: number;
  used_count: number;
  applies_to_plans: string[];
  first_payment_only: boolean;
  min_amount: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  tenant_id: string;
  invoice_id?: string;
  discount_amount: number;
  used_at: string;
}

// --- Payment Methods ---
export interface PaymentMethod {
  id: string;
  tenant_id: string;
  provider: PaymentProvider;
  external_id?: string;
  type: 'card' | 'bank_account' | 'wallet';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  billing_details: Record<string, any>;
  created_at: string;
}

// --- Revenue Analytics ---
export interface RevenueAnalytics {
  id: string;
  period: string;
  mrr: number;
  arr: number;
  new_revenue: number;
  expansion_revenue: number;
  churned_revenue: number;
  net_revenue: number;
  active_subscriptions: number;
  new_subscriptions: number;
  cancelled_subscriptions: number;
  churn_rate: number;
  avg_revenue_per_user: number;
  created_at: string;
}

// --- Enterprise Contracts ---
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';

export interface EnterpriseContract {
  id: string;
  tenant_id: string;
  contract_number: string;
  title: string;
  status: ContractStatus;
  start_date: string;
  end_date?: string;
  annual_value: number;
  payment_terms: string;
  custom_limits: Record<string, any>;
  sla_config: Record<string, any>;
  billing_frequency: 'monthly' | 'quarterly' | 'annually';
  auto_renew: boolean;
  signed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Billing Dashboard ---
export interface BillingDashboard {
  current_plan: Plan | null;
  subscription: Subscription | null;
  usage: UsageSummary[];
  upcoming_invoice: Invoice | null;
  recent_payments: Payment[];
  days_until_renewal: number;
}

// --- Revenue Summary ---
export interface RevenueSummary {
  mrr: number;
  arr: number;
  mrr_growth: number;
  churn_rate: number;
  ltv: number;
  active_subscriptions: number;
  revenue_by_plan: { plan: string; revenue: number }[];
  revenue_by_country: { country: string; revenue: number }[];
}

// --- Trial Info ---
export interface TrialInfo {
  is_trial: boolean;
  trial_ends_at?: string;
  days_remaining: number;
  features_available: string[];
  features_locked: string[];
}