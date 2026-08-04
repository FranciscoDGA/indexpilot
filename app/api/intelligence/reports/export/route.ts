import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceEngine } from '@/lib/intelligence/intelligenceEngine';
import { ReportGenerator } from '@/lib/intelligence/reportGenerator';
import { Insight, Recommendation } from '@/types/intelligence';

type ExportFormat = 'pdf' | 'csv' | 'json' | 'html';

async function handleExport(
  publication_id: string,
  period: string,
  format: string
) {
  if (!publication_id) {
    return NextResponse.json(
      { error: 'publication_id é obrigatório' },
      { status: 400 }
    );
  }

  if (!['pdf', 'csv', 'json', 'html'].includes(format)) {
    return NextResponse.json(
      { error: 'Formato inválido. Use: pdf, csv, json ou html' },
      { status: 400 }
    );
  }

  const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
    ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
    : (await import('@/lib/supabase/server')).createClient();

  const engine = new IntelligenceEngine(supabaseClient);
  const reportGen = new ReportGenerator(supabaseClient);

  const insights = await engine.generateInsights(publication_id);
  const recommendations = await engine.generateRecommendations(insights);
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

  let content: Buffer | string;
  let contentType: string;
  let filename: string;
  const timestamp = new Date().toISOString().split('T')[0];

  switch (format as ExportFormat) {
    case 'csv':
      content = generateCSV(insights, recommendations);
      contentType = 'text/csv';
      filename = `relatorio-seo-${period}-${timestamp}.csv`;
      break;

    case 'json':
      content = JSON.stringify(
        {
          publication_id,
          period,
          generated_at: new Date().toISOString(),
          health_scores: healthScores,
          insights,
          recommendations,
          report,
        },
        null,
        2
      );
      contentType = 'application/json';
      filename = `relatorio-seo-${period}-${timestamp}.json`;
      break;

    case 'html':
      content = generateHTML(publication_id, period, healthScores, insights, recommendations, report);
      contentType = 'text/html';
      filename = `relatorio-seo-${period}-${timestamp}.html`;
      break;

    case 'pdf':
    default:
      content = await generatePDF(publication_id, period, healthScores, insights, recommendations, report);
      contentType = 'application/pdf';
      filename = `relatorio-seo-${period}-${timestamp}.pdf`;
      break;
  }

  const body = typeof content === 'string' ? content : (Buffer.isBuffer(content) ? new Uint8Array(content) : new TextEncoder().encode(content));

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publication_id = searchParams.get('publication_id');
    const period = searchParams.get('period') || 'daily';
    const format = searchParams.get('format') || 'pdf';

    return await handleExport(publication_id || '', period, format);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar relatório' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publication_id, period = 'daily', format = 'pdf' } = body;

    return await handleExport(publication_id, period, format);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar relatório' },
      { status: 500 }
    );
  }
}

function generateCSV(insights: Insight[], recommendations: Recommendation[]): string {
  const lines: string[] = [];

  lines.push('INSIGHTS');
  lines.push('ID,Tipo,Prioridade,Título,Descrição,Status,Impacto Estimado,Esforço Estimado');
  insights.forEach(insight => {
    const row = [
      insight.id,
      insight.type,
      insight.priority,
      `"${insight.title}"`,
      `"${insight.description}"`,
      insight.status,
      insight.estimated_impact,
      insight.estimated_effort,
    ].join(',');
    lines.push(row);
  });

  lines.push('');
  lines.push('RECOMMENDATIONS');
  lines.push('ID,Título,Categoria,ROI Score,Impacto Estimado,Esforço Estimado,Status');
  recommendations.forEach(rec => {
    const row = [
      rec.id,
      `"${rec.title}"`,
      rec.category,
      rec.score,
      rec.estimated_impact,
      rec.estimated_effort,
      rec.status,
    ].join(',');
    lines.push(row);
  });

  return lines.join('\n');
}

function generateHTML(
  publicationId: string,
  period: string,
  healthScores: any,
  insights: Insight[],
  recommendations: Recommendation[],
  report: any
): string {
  const timestamp = new Date().toLocaleString('pt-BR');
  const criticalInsights = insights.filter(i => i.priority === 'CRITICAL').length;
  const highInsights = insights.filter(i => i.priority === 'HIGH').length;
  const avgROI = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length)
    : 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório SEO - ${period}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 32px;
            color: #1f2937;
        }
        .header p {
            color: #6b7280;
            margin-top: 5px;
        }
        .kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .kpi-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .kpi-card.health {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .kpi-card.critical {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .kpi-card.opportunities {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: #333;
        }
        .kpi-card.roi {
            background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
        }
        .kpi-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .kpi-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .section {
            margin: 40px 0;
            page-break-inside: avoid;
        }
        .section h2 {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
            padding-left: 10px;
        }
        .insights-list {
            margin-top: 15px;
        }
        .insight-item {
            background: #f9fafb;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .insight-title {
            font-weight: bold;
            color: #1f2937;
        }
        .insight-priority {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .priority-critical {
            background: #fee2e2;
            color: #991b1b;
        }
        .priority-high {
            background: #fed7aa;
            color: #92400e;
        }
        .priority-medium {
            background: #fef3c7;
            color: #78350f;
        }
        .priority-low {
            background: #dcfce7;
            color: #166534;
        }
        .recommendations-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .recommendations-table th,
        .recommendations-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .recommendations-table th {
            background: #f3f4f6;
            font-weight: bold;
            color: #1f2937;
        }
        .recommendations-table tr:hover {
            background: #f9fafb;
        }
        .roi-score {
            font-weight: bold;
            color: #2563eb;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
            text-align: center;
        }
        @media print {
            body {
                background: white;
            }
            .container {
                padding: 0;
                max-width: 100%;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório SEO</h1>
            <p><strong>Período:</strong> ${period.toUpperCase()} | <strong>Gerado em:</strong> ${timestamp}</p>
        </div>

        <div class="kpis">
            <div class="kpi-card health">
                <div class="kpi-label">Saúde SEO</div>
                <div class="kpi-value">${healthScores.overall_health}%</div>
            </div>
            <div class="kpi-card critical">
                <div class="kpi-label">Problemas Críticos</div>
                <div class="kpi-value">${criticalInsights}</div>
            </div>
            <div class="kpi-card opportunities">
                <div class="kpi-label">Oportunidades</div>
                <div class="kpi-value">${recommendations.length}</div>
            </div>
            <div class="kpi-card roi">
                <div class="kpi-label">ROI Médio</div>
                <div class="kpi-value">${avgROI}</div>
            </div>
        </div>

        <div class="section">
            <h2>📌 Insights Críticos e Altos</h2>
            <div class="insights-list">
                ${insights
                  .filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH')
                  .map(
                    insight => `
                    <div class="insight-item">
                        <div class="insight-title">
                            ${insight.title}
                            <span class="insight-priority priority-${insight.priority.toLowerCase()}">
                                ${insight.priority}
                            </span>
                        </div>
                        <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
                            ${insight.description}
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>

        <div class="section">
            <h2>⭐ Top 10 Oportunidades por ROI</h2>
            <table class="recommendations-table">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Categoria</th>
                        <th>Esforço</th>
                        <th>ROI Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${recommendations
                      .slice(0, 10)
                      .map(
                        rec => `
                        <tr>
                            <td>${rec.title}</td>
                            <td>${rec.category}</td>
                            <td>${rec.estimated_effort}</td>
                            <td><span class="roi-score">${rec.score}</span></td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📈 Métricas de Saúde</h2>
            <div class="insights-list">
                <div class="insight-item">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span><strong>Potencial de Crescimento</strong></span>
                        <span>${healthScores.growth_potential}%</span>
                    </div>
                    <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; background: #2563eb; width: ${healthScores.growth_potential}%;"></div>
                    </div>
                </div>
                <div class="insight-item">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span><strong>Velocidade de Índice</strong></span>
                        <span>${healthScores.index_velocity}%</span>
                    </div>
                    <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; background: #10b981; width: ${healthScores.index_velocity}%;"></div>
                    </div>
                </div>
                <div class="insight-item">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span><strong>Frescor de Conteúdo</strong></span>
                        <span>${healthScores.content_freshness}%</span>
                    </div>
                    <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; background: #a855f7; width: ${healthScores.content_freshness}%;"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Resumo Executivo</h2>
            <div class="insights-list">
                <div class="insight-item">
                    <p><strong>Saúde Geral:</strong> ${getHealthStatus(healthScores.overall_health)} (${healthScores.overall_health}%)</p>
                    <p style="margin-top: 8px;"><strong>Problemas Críticos:</strong> ${criticalInsights} ${criticalInsights === 0 ? '✓' : '⚠️'}</p>
                    <p style="margin-top: 8px;"><strong>Oportunidades Totais:</strong> ${recommendations.length} com ROI médio ${avgROI}</p>
                    <p style="margin-top: 8px;"><strong>Recomendação:</strong> ${getRecommendation(criticalInsights, recommendations.length)}</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>IndexPilot | Relatório Gerado Automaticamente</p>
            <p>Este relatório contém informações confidenciais e deve ser tratado com sigilo.</p>
        </div>
    </div>
</body>
</html>`;
}

async function generatePDF(
  publicationId: string,
  period: string,
  healthScores: any,
  insights: Insight[],
  recommendations: Recommendation[],
  report: any
): Promise<Buffer> {
  try {
    // @ts-ignore pdfkit may not be installed
    const PDFDocument = (await import('pdfkit')).default;
    // @ts-ignore pdfkit may not be installed
    const { registerFont } = await import('pdfkit');

    const doc = new PDFDocument({
      bufferPages: true,
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const timestamp = new Date().toLocaleString('pt-BR');
    const criticalInsights = insights.filter(i => i.priority === 'CRITICAL').length;
    const highInsights = insights.filter(i => i.priority === 'HIGH').length;
    const avgROI = recommendations.length > 0
      ? Math.round(recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length)
      : 0;

    doc.fontSize(24).font('Helvetica-Bold').text('Relatório SEO', 50, 50);
    doc.fontSize(12).font('Helvetica').text(`Período: ${period.toUpperCase()}`, 50, 80);
    doc.fontSize(11).text(`Gerado em: ${timestamp}`, 50, 100);

    doc.moveTo(50, 125).lineTo(545, 125).stroke();

    doc.fontSize(14).font('Helvetica-Bold').text('KPIs Principais', 50, 150);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Saúde SEO: ${healthScores.overall_health}%`, 50, 175);
    doc.text(`Problemas Críticos: ${criticalInsights}`, 50, 195);
    doc.text(`Oportunidades: ${recommendations.length}`, 50, 215);
    doc.text(`ROI Médio: ${avgROI}`, 50, 235);

    doc.fontSize(14).font('Helvetica-Bold').text('Insights Críticos e Altos', 50, 280);
    let yPosition = 310;
    insights
      .filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH')
      .slice(0, 5)
      .forEach(insight => {
        doc.fontSize(11).font('Helvetica-Bold').text(insight.title, 50, yPosition);
        doc.fontSize(10).font('Helvetica').text(`[${insight.priority}] ${insight.description}`, 50, yPosition + 20, {
          width: 495,
          align: 'left',
        });
        yPosition += 60;
      });

    doc.moveTo(50, yPosition + 10).lineTo(545, yPosition + 10).stroke();

    doc.fontSize(14).font('Helvetica-Bold').text('Top Oportunidades', 50, yPosition + 35);
    yPosition += 60;
    doc.fontSize(10).font('Helvetica-Bold').text('Título', 50, yPosition);
    doc.text('Categoria', 250, yPosition);
    doc.text('ROI', 450, yPosition);
    doc.moveTo(50, yPosition + 15).lineTo(545, yPosition + 15).stroke();

    yPosition += 25;
    recommendations
      .slice(0, 10)
      .forEach(rec => {
        doc.fontSize(10).font('Helvetica');
        doc.text(rec.title.substring(0, 30), 50, yPosition);
        doc.text(rec.category, 250, yPosition);
        doc.text(rec.score.toString(), 450, yPosition);
        yPosition += 20;
      });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });
  } catch (error) {
    console.warn('PDFKit não disponível, retornando HTML em vez de PDF:', error);
    const htmlContent = generateHTML(publicationId, period, healthScores, insights, recommendations, report);
    return Buffer.from(htmlContent);
  }
}

function getHealthStatus(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Moderado';
  return 'Crítico';
}

function getRecommendation(criticalCount: number, opportunitiesCount: number): string {
  if (criticalCount > 0) {
    return 'Resolver alertas críticos imediatamente';
  }
  if (opportunitiesCount > 5) {
    return 'Executar quick wins para ganhos rápidos';
  }
  return 'Site em bom estado. Continuar monitoramento regular';
}
