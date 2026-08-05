import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReportBuilder } from '@/lib/analytics';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const reportId = searchParams.get('report_id');

    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const builder = new ReportBuilder();

    if (reportId) {
      const report = await builder.getReport(reportId);
      if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      const runs = await builder.getReportRuns(reportId);
      return NextResponse.json({ success: true, data: { report, runs } });
    }

    const reports = await builder.getReports(tenantId);
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, tenant_id, report_id, name, description, report_type, widgets, filters, schedule_cron, recipients, export_format } = body;

    const builder = new ReportBuilder();

    if (action === 'generate' && report_id) {
      const run = await builder.generateReport(report_id, user.id);
      return NextResponse.json({ success: true, data: run });
    }

    if (action === 'create') {
      if (!tenant_id || !name || !report_type) {
        return NextResponse.json({ error: 'tenant_id, name, and report_type required' }, { status: 400 });
      }
      const report = await builder.createReport({
        tenantId: tenant_id,
        name,
        description,
        reportType: report_type,
        widgets,
        filters,
        scheduleCron: schedule_cron,
        recipients,
        exportFormat: export_format,
      });
      return NextResponse.json({ success: true, data: report });
    }

    if (action === 'delete' && report_id) {
      await builder.deleteReport(report_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}