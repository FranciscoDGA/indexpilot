import { createClient } from '@/lib/supabase/server';
import type { ReportDefinition, ReportRun, ReportType, ExportFormat, ReportWidget } from '@/types/analytics';

export class ReportBuilder {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async createReport(params: {
    tenantId: string;
    name: string;
    description?: string;
    reportType: ReportType;
    widgets?: ReportWidget[];
    filters?: Record<string, any>;
    scheduleCron?: string;
    recipients?: string[];
    exportFormat?: ExportFormat;
  }): Promise<ReportDefinition> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .insert({
        tenant_id: params.tenantId,
        name: params.name,
        description: params.description,
        report_type: params.reportType,
        config: {},
        widgets: params.widgets || [],
        filters: params.filters || {},
        schedule_cron: params.scheduleCron,
        recipients: params.recipients || [],
        export_format: params.exportFormat || 'pdf',
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReportDefinition;
  }

  async getReports(tenantId: string): Promise<ReportDefinition[]> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ReportDefinition[];
  }

  async getReport(reportId: string): Promise<ReportDefinition | null> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) return null;
    return data as ReportDefinition;
  }

  async updateReport(reportId: string, updates: Partial<ReportDefinition>): Promise<ReportDefinition> {
    const { data, error } = await this.supabase
      .from('report_definitions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data as ReportDefinition;
  }

  async generateReport(reportId: string, requestedBy?: string): Promise<ReportRun> {
    const report = await this.getReport(reportId);
    if (!report) throw new Error('Report not found');

    const { data: run, error: runError } = await this.supabase
      .from('report_runs')
      .insert({
        report_id: reportId,
        tenant_id: report.tenant_id,
        status: 'running',
        file_format: report.export_format,
        requested_by: requestedBy,
      })
      .select()
      .single();

    if (runError) throw runError;

    try {
      const reportData = await this.fetchReportData(report);
      const fileUrl = await this.renderReport(report, reportData);
      const completedAt = new Date().toISOString();

      await this.supabase
        .from('report_runs')
        .update({
          status: 'completed',
          file_url: fileUrl,
          completed_at: completedAt,
        })
        .eq('id', run.id);

      await this.supabase
        .from('report_definitions')
        .update({ last_generated_at: completedAt })
        .eq('id', reportId);

      return { ...run, status: 'completed', file_url: fileUrl, completed_at: completedAt } as ReportRun;
    } catch (error: any) {
      await this.supabase
        .from('report_runs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      return { ...run, status: 'failed', error_message: error.message } as ReportRun;
    }
  }

  async getReportRuns(reportId: string, limit: number = 10): Promise<ReportRun[]> {
    const { data, error } = await this.supabase
      .from('report_runs')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ReportRun[];
  }

  async deleteReport(reportId: string): Promise<void> {
    const { error } = await this.supabase
      .from('report_definitions')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
  }

  async getDefaultWidgets(reportType: ReportType): Promise<ReportWidget[]> {
    const widgetSets: Record<ReportType, ReportWidget[]> = {
      executive: [
        { id: crypto.randomUUID(), type: 'kpi_cards', title: 'Key Metrics', config: { metrics: ['seo_health_index', 'platform_uptime', 'mrr'] }, position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'Revenue Trend', config: { metric: 'revenue', period: '30d' }, position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'SEO Score Trend', config: { metric: 'seo_score', period: '30d' }, position: { x: 6, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'alerts_list', title: 'Recent Alerts', config: { severity: ['warning', 'critical'], limit: 5 }, position: { x: 0, y: 6, w: 12, h: 3 } },
      ],
      seo: [
        { id: crypto.randomUUID(), type: 'kpi_cards', title: 'SEO Overview', config: { metrics: ['indexed_urls', 'seo_score', 'crawl_errors'] }, position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: crypto.randomUUID(), type: 'area_chart', title: 'Indexation Trend', config: { metric: 'indexed_urls', period: '30d' }, position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'bar_chart', title: 'Error Distribution', config: { metric: 'crawl_errors', group_by: 'error_type' }, position: { x: 6, y: 2, w: 6, h: 4 } },
      ],
      content: [
        { id: crypto.randomUUID(), type: 'kpi_cards', title: 'Content Overview', config: { metrics: ['total_articles', 'new_articles', 'avg_content_quality'] }, position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'Content Growth', config: { metric: 'total_articles', period: '30d' }, position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'pie_chart', title: 'Topic Distribution', config: { metric: 'topic_clusters', group_by: 'topic' }, position: { x: 6, y: 2, w: 6, h: 4 } },
      ],
      competitor: [
        { id: crypto.randomUUID(), type: 'table', title: 'Competitor Comparison', config: { metrics: ['pages', 'traffic', 'authority'] }, position: { x: 0, y: 0, w: 12, h: 4 } },
        { id: crypto.randomUUID(), type: 'bar_chart', title: 'Market Share', config: { metric: 'market_share_pct' }, position: { x: 0, y: 4, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'Growth Comparison', config: { metric: 'page_growth_pct', period: '30d' }, position: { x: 6, y: 4, w: 6, h: 4 } },
      ],
      billing: [
        { id: crypto.randomUUID(), type: 'kpi_cards', title: 'Financial Overview', config: { metrics: ['mrr', 'arr', 'churn_rate'] }, position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'MRR Trend', config: { metric: 'mrr', period: '90d' }, position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'bar_chart', title: 'Revenue by Plan', config: { metric: 'revenue', group_by: 'plan' }, position: { x: 6, y: 2, w: 6, h: 4 } },
      ],
      monitoring: [
        { id: crypto.randomUUID(), type: 'kpi_cards', title: 'Monitoring Overview', config: { metrics: ['uptime_pct', 'avg_response_time_ms', 'incidents_count'] }, position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'Uptime Trend', config: { metric: 'uptime_pct', period: '30d' }, position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'area_chart', title: 'Response Time', config: { metric: 'avg_response_time_ms', period: '30d' }, position: { x: 6, y: 2, w: 6, h: 4 } },
      ],
      automation: [
        { id: crypto.randomUUID(), type: 'kpi_cards', title: 'Automation Overview', config: { metrics: ['workflows_executed', 'success_rate', 'time_saved_hours'] }, position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: crypto.randomUUID(), type: 'bar_chart', title: 'Workflow Execution', config: { metric: 'workflows_executed', group_by: 'workflow' }, position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: crypto.randomUUID(), type: 'line_chart', title: 'Automation Trend', config: { metric: 'tasks_automated', period: '30d' }, position: { x: 6, y: 2, w: 6, h: 4 } },
      ],
      custom: [
        { id: crypto.randomUUID(), type: 'table', title: 'Custom Data', config: {}, position: { x: 0, y: 0, w: 12, h: 6 } },
      ],
    };

    return widgetSets[reportType] || widgetSets.custom;
  }

  private async fetchReportData(report: ReportDefinition): Promise<Record<string, any>> {
    return {
      report,
      generated_at: new Date().toISOString(),
      data: {},
    };
  }

  private async renderReport(report: ReportDefinition, data: Record<string, any>): Promise<string> {
    return `reports/${report.id}/${Date.now()}.${report.export_format}`;
  }
}