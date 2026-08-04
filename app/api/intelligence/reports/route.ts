import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceEngine } from '@/lib/intelligence/intelligenceEngine';
import { ReportGenerator } from '@/lib/intelligence/reportGenerator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publication_id = searchParams.get('publication_id');
    const period = searchParams.get('period') || 'daily';

    if (!publication_id) {
      return NextResponse.json(
        { error: 'publication_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const engine = new IntelligenceEngine(supabaseClient);
    const reportGen = new ReportGenerator(supabaseClient);

    const insights = await engine.generateInsights(publication_id);
    const healthScores = await engine.calculateHealthScores(publication_id);

    let report;
    switch (period) {
      case 'weekly':
        report = await reportGen.generateWeeklyReport(publication_id, healthScores, insights);
        break;
      case 'monthly':
        report = await reportGen.generateMonthlyReport(publication_id, healthScores, insights);
        break;
      case 'daily':
      default:
        report = await reportGen.generateDailyReport(publication_id, healthScores, insights);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
