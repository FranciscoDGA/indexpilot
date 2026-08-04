import { Insight, Recommendation, SeoHealthScore } from '@/types/intelligence';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function createCriticalAlertTemplate(
  publication: string,
  insights: Insight[],
  healthScores: SeoHealthScore
): EmailTemplate {
  const criticalInsights = insights.filter(i => i.priority === 'CRITICAL').slice(0, 5);
  const timestamp = new Date().toLocaleString('pt-BR');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .insight { background: white; margin: 15px 0; padding: 15px; border-left: 4px solid #dc2626; border-radius: 4px; }
          .insight-title { font-weight: bold; color: #1f2937; }
          .insight-desc { color: #6b7280; font-size: 14px; margin-top: 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
          .footer { background: #f3f4f6; padding: 15px 20px; font-size: 12px; color: #6b7280; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
          .metric { display: inline-block; margin: 10px 15px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #dc2626; }
          .metric-label { font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🚨 ALERTA CRÍTICO</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Problemas críticos detectados no seu site</p>
          </div>

          <div class="content">
            <p>Olá,</p>
            <p>Detectamos <strong>${criticalInsights.length} problema(s) crítico(s)</strong> no seu site <strong>${publication}</strong> que requerem atenção imediata.</p>

            <div style="text-align: center; padding: 15px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
              <div class="metric">
                <div class="metric-value" style="color: #2563eb;">${healthScores.overall_health}%</div>
                <div class="metric-label">Saúde SEO</div>
              </div>
            </div>

            <h2 style="color: #1f2937; font-size: 18px; margin-top: 20px;">Problemas Críticos:</h2>

            ${criticalInsights.map(insight => `
              <div class="insight">
                <div class="insight-title">⚠️ ${insight.title}</div>
                <div class="insight-desc">${insight.description}</div>
                <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                  <strong>Impacto:</strong> ${insight.estimated_impact} | <strong>Esforço:</strong> ${insight.estimated_effort}
                </div>
              </div>
            `).join('')}

            <a href="https://indexpilot.app/intelligence" class="button">
              Ver todos os detalhes →
            </a>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              ℹ️ <strong>Dica:</strong> Para reduzir a quantidade de alertas, configure suas preferências de notificações.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0; margin-bottom: 8px;">Relatório gerado: ${timestamp}</p>
            <p style="margin: 0;">© 2026 IndexPilot. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
ALERTA CRÍTICO - IndexPilot

Detectamos ${criticalInsights.length} problema(s) crítico(s) no seu site ${publication}.

Saúde SEO: ${healthScores.overall_health}%

PROBLEMAS CRÍTICOS:
${criticalInsights.map(i => `- ${i.title}\n  ${i.description}`).join('\n\n')}

Acesse o painel para mais detalhes:
https://indexpilot.app/intelligence

Gerado: ${timestamp}
  `;

  return {
    subject: `🚨 ALERTA: ${criticalInsights.length} Problema(s) Crítico(s) Detectado(s)`,
    html,
    text,
  };
}

export function createDailyDigestTemplate(
  publication: string,
  insights: Insight[],
  recommendations: Recommendation[],
  healthScores: SeoHealthScore
): EmailTemplate {
  const criticalCount = insights.filter(i => i.priority === 'CRITICAL').length;
  const highCount = insights.filter(i => i.priority === 'HIGH').length;
  const topRecommendations = recommendations.slice(0, 5);
  const timestamp = new Date().toLocaleString('pt-BR');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
          .kpi-card { background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .kpi-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
          .rec-item { background: white; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 4px solid #2563eb; display: flex; justify-content: space-between; align-items: center; }
          .rec-title { font-weight: 500; }
          .rec-roi { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; text-align: center; width: 100%; margin-top: 15px; box-sizing: border-box; }
          .footer { background: #f3f4f6; padding: 15px 20px; font-size: 12px; color: #6b7280; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📊 Seu Relatório Diário SEO</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${publication}</p>
          </div>

          <div class="content">
            <p>Olá,</p>
            <p>Aqui está o resumo de hoje da saúde SEO do seu site:</p>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-value" style="color: #2563eb;">${healthScores.overall_health}%</div>
                <div class="kpi-label">Saúde SEO</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value" style="color: #dc2626;">${criticalCount}</div>
                <div class="kpi-label">Alertas Críticos</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value" style="color: #f59e0b;">${highCount}</div>
                <div class="kpi-label">Alertas Altos</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-value" style="color: #10b981;">${insights.length}</div>
                <div class="kpi-label">Descobertas</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🎯 Top 5 Oportunidades</div>
              ${topRecommendations.map(rec => `
                <div class="rec-item">
                  <span class="rec-title">${rec.title}</span>
                  <span class="rec-roi">${rec.score} ROI</span>
                </div>
              `).join('')}
            </div>

            <a href="https://indexpilot.app/intelligence" class="button">
              Ver Dashboard Completo →
            </a>

            <p style="color: #6b7280; font-size: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              💡 Você recebe este relatório diariamente às 8h da manhã. Altere a frequência em suas preferências.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0; margin-bottom: 8px;">Relatório de: ${timestamp}</p>
            <p style="margin: 0;">© 2026 IndexPilot. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
RELATÓRIO DIÁRIO SEO - ${publication}

Saúde SEO: ${healthScores.overall_health}%
Alertas Críticos: ${criticalCount}
Alertas Altos: ${highCount}
Descobertas: ${insights.length}

TOP 5 OPORTUNIDADES:
${topRecommendations.map(r => `- ${r.title} (ROI: ${r.score})`).join('\n')}

Acesse o painel completo:
https://indexpilot.app/intelligence

${timestamp}
  `;

  return {
    subject: `📊 Seu Relatório Diário SEO - ${publication} (${healthScores.overall_health}%)`,
    html,
    text,
  };
}

export function createWeeklyReportTemplate(
  publication: string,
  insights: Insight[],
  recommendations: Recommendation[],
  healthScores: SeoHealthScore
): EmailTemplate {
  const timestamp = new Date().toLocaleString('pt-BR');
  const trend = healthScores.overall_health >= 75 ? '📈 Melhorando' : healthScores.overall_health >= 50 ? '➡️ Estável' : '📉 Piorando';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .metric { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
          .metric-title { font-weight: bold; color: #1f2937; }
          .metric-progress { height: 8px; background: #e5e7eb; border-radius: 4px; margin-top: 8px; overflow: hidden; }
          .progress-bar { height: 100%; background: #2563eb; }
          .metric-value { text-align: right; font-weight: bold; color: #2563eb; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; color: #1f2937; font-size: 16px; margin-bottom: 10px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; text-align: center; width: 100%; box-sizing: border-box; }
          .footer { background: #f3f4f6; padding: 15px 20px; font-size: 12px; color: #6b7280; text-align: center; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📋 Relatório Semanal SEO</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Semana de ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} a ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Olá,</h2>
            <p>Seu relatório semanal de <strong>${publication}</strong> está pronto!</p>

            <div class="section">
              <div class="section-title">📊 Métricas Principais</div>

              <div class="metric">
                <div style="display: flex; justify-content: space-between;">
                  <span class="metric-title">Saúde SEO</span>
                  <span class="metric-value">${healthScores.overall_health}%</span>
                </div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${healthScores.overall_health}%;"></div>
                </div>
              </div>

              <div class="metric">
                <div style="display: flex; justify-content: space-between;">
                  <span class="metric-title">Potencial de Crescimento</span>
                  <span class="metric-value">${healthScores.growth_potential}%</span>
                </div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${healthScores.growth_potential}%; background: #10b981;"></div>
                </div>
              </div>

              <div class="metric">
                <div style="display: flex; justify-content: space-between;">
                  <span class="metric-title">Velocidade de Índice</span>
                  <span class="metric-value">${healthScores.index_velocity}%</span>
                </div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${healthScores.index_velocity}%; background: #f59e0b;"></div>
                </div>
              </div>

              <div class="metric">
                <div style="display: flex; justify-content: space-between;">
                  <span class="metric-title">Frescor de Conteúdo</span>
                  <span class="metric-value">${healthScores.content_freshness}%</span>
                </div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${healthScores.content_freshness}%; background: #8b5cf6;"></div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">🎯 Resumo</div>
              <p>
                <strong>Tendência:</strong> ${trend}<br>
                <strong>Total de Descobertas:</strong> ${insights.length}<br>
                <strong>Oportunidades:</strong> ${recommendations.length}
              </p>
            </div>

            <a href="https://indexpilot.app/reports" class="button">
              Ver Relatório Completo →
            </a>
          </div>

          <div class="footer">
            <p style="margin: 0; margin-bottom: 8px;">Relatório de: ${timestamp}</p>
            <p style="margin: 0;">© 2026 IndexPilot. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
RELATÓRIO SEMANAL SEO

Saúde SEO: ${healthScores.overall_health}%
Tendência: ${trend}
Descobertas: ${insights.length}
Oportunidades: ${recommendations.length}

Acesse o painel completo:
https://indexpilot.app/reports

${timestamp}
  `;

  return {
    subject: `📋 Seu Relatório Semanal SEO - ${publication}`,
    html,
    text,
  };
}
