import { createClient } from '@/lib/supabase/server';
import type { Invoice, InvoiceLineItem, InvoiceStatus } from '@/types/billing';

export class InvoiceEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async generateInvoiceNumber(): Promise<string> {
    const { count } = await this.supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true });

    const num = (count || 0) + 1;
    return `INV-${new Date().getFullYear()}-${String(num).padStart(6, '0')}`;
  }

  async createInvoice(params: {
    tenantId: string;
    subscriptionId?: string;
    lineItems: InvoiceLineItem[];
    discount?: number;
    tax?: number;
    billingReason?: string;
    dueDate?: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<Invoice> {
    const subtotal = params.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discount = params.discount || 0;
    const tax = params.tax || 0;
    const total = subtotal - discount + tax;

    const invoiceNumber = await this.generateInvoiceNumber();

    const { data, error } = await this.supabase
      .from('invoices')
      .insert({
        tenant_id: params.tenantId,
        subscription_id: params.subscriptionId,
        invoice_number: invoiceNumber,
        status: 'pending',
        currency: 'USD',
        subtotal,
        discount,
        tax,
        total,
        amount_paid: 0,
        amount_due: total,
        due_date: params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billing_reason: params.billingReason || 'subscription_cycle',
        line_items: params.lineItems,
        period_start: params.periodStart,
        period_end: params.periodEnd,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) return null;
    return data;
  }

  async getInvoices(tenantId: string, limit: number = 50): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const updates: Record<string, any> = { status };

    if (status === 'paid') {
      updates.paid_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async applyCoupon(invoiceId: string, couponId: string, discountAmount: number): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const newDiscount = invoice.discount + discountAmount;
    const newTotal = invoice.subtotal - newDiscount + invoice.tax;

    const { data, error } = await this.supabase
      .from('invoices')
      .update({
        discount: newDiscount,
        total: newTotal,
        amount_due: newTotal - invoice.amount_paid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    // Record coupon usage
    await this.supabase.from('coupon_usage').insert({
      coupon_id: couponId,
      tenant_id: invoice.tenant_id,
      invoice_id: invoiceId,
      discount_amount: discountAmount,
    });

    // Update coupon used count
    await this.supabase
      .from('coupons')
      .update({ used_count: (await this.supabase.from('coupons').select('used_count').eq('id', couponId).single()).data?.used_count + 1 || 1 })
      .eq('id', couponId);

    return data;
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async markOverdueInvoices(): Promise<number> {
    const overdue = await this.getOverdueInvoices();

    for (const invoice of overdue) {
      await this.updateInvoiceStatus(invoice.id, 'overdue');
    }

    return overdue.length;
  }
}