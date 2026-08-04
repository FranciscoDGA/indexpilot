import { Insight, Recommendation, SeoHealthScore, Report } from '@/types/intelligence';

export class ReportGenerator {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async generateDailyReport(publicationId: string, healthScore: SeoHealthScore, insights: Insight[], recommendations: Recommendation[] = []): Promise<Report> {
    const summary = this.generateSummary(insights, 'daily');

    return {
      publication_id: publicationId,
      user_id: 'mock-user-123',
      type: 'daily',
      insights,
      recommendations,
      health_scores: healthScore,
      summary,
      created_at: new Date().toISOString(),
    };
  }

  async generateWeeklyReport(publicationId: string, healthScore: SeoHealthScore, insights: Insight[], recommendations: Recommendation[] = []): Promise<Report> {
    const summary = this.generateSummary(insights, 'weekly');

    return {
      publication_id: publicationId,
      user_id: 'mock-user-123',
      type: 'weekly',
      insights,
      recommendations,
      health_scores: healthScore,
      summary,
      created_at: new Date().toISOString(),
    };
  }

  async generateMonthlyReport(publicationId: string, healthScore: SeoHealthScore, insights: Insight[], recommendations: Recommendation[] = []): Promise<Report> {
    const summary = this.generateSummary(insights, 'monthly');

    return {
      publication_id: publicationId,
      user_id: 'mock-user-123',
      type: 'monthly',
      insights,
      recommendations,
      health_scores: healthScore,
      summary,
      created_at: new Date().toISOString(),
    };
  }

  private generateSummary(insights: Insight[], period: string): string {
    const total = insights.length;
    const critical = insights.filter(i => i.priority === 'CRITICAL').length;
    const high = insights.filter(i => i.priority === 'HIGH').length;

    if (total === 0) {
      return `Relatório ${period}: Nenhuma insight detectada. Seu site está em ótimo estado!`;
    }

    return `Relatório ${period}: ${total} insights detectadas. ${critical} crítica(s), ${high} alta(s) prioridade. Foco nos problemas críticos para melhorar o SEO rapidamente.`;
  }

  private groupInsightsByType(insights: Insight[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const insight of insights) {
      grouped[insight.type] = (grouped[insight.type] || 0) + 1;
    }

    return grouped;
  }

  async generatePdf(report: Report): Promise<Buffer> {
    const htmlContent = this.generateHtmlReport(report);
    return Buffer.from(htmlContent, 'utf-8');
  }

  private generateHtmlReport(report: Report): string {
    const criticalCount = report.insights.filter(i => i.priority === 'CRITICAL').length;
    const highCount = report.insights.filter(i => i.priority === 'HIGH').length;
    const mediumCount = report.insights.filter(i => i.priority === 'MEDIUM').length;
    const lowCount = report.insights.filter(i => i.priority === 'LOW').length;

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório SEO - ${report.type}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .metric { display: inline-block; width: 23%; margin: 1%; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .critical { color: #d32f2f; font-weight: bold; }
        .high { color: #f57c00; font-weight: bold; }
        .summary { margin: 20px 0; padding: 15px; background: #e3f2fd; border-left: 4px solid #1976d2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de SEO - ${report.type}</h1>
        <p>Gerado em: ${new Date(report.created_at || new Date().toISOString()).toLocaleDateString('pt-BR')}</p>
      </div>
      <div class="summary">${report.summary}</div>
      <h2>Saúde SEO</h2>
      <div class="metric">
        <div>Saúde Geral</div>
        <div style="font-size: 24px; font-weight: bold;">${report.health_scores.overall_health}%</div>
      </div>
      <div class="metric">
        <div>Potencial de Crescimento</div>
        <div style="font-size: 24px; font-weight: bold;">${report.health_scores.growth_potential}%</div>
      </div>
      <div class="metric">
        <div>Velocidade de Índice</div>
        <div style="font-size: 24px; font-weight: bold;">${report.health_scores.index_velocity}%</div>
      </div>
      <div class="metric">
        <div>Frescor de Conteúdo</div>
        <div style="font-size: 24px; font-weight: bold;">${report.health_scores.content_freshness}%</div>
      </div>
      <h2>Insights por Prioridade</h2>
      <p class="critical">Críticas: ${criticalCount}</p>
      <p class="high">Altas: ${highCount}</p>
      <p>Médias: ${mediumCount}</p>
      <p>Baixas: ${lowCount}</p>
    </body>
    </html>
    `;
  }
}
