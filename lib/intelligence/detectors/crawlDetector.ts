import { Insight, Priority } from '@/types/intelligence';

export class CrawlDetector {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async detectCrawlStopped(publicationId: string, daysSinceCheckThreshold: number = 14): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_indexed', true)
        .lt('last_checked', new Date(Date.now() - daysSinceCheckThreshold * 24 * 60 * 60 * 1000).toISOString());

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const daysSinceLastCheck = url.last_checked
          ? Math.floor((Date.now() - new Date(url.last_checked).getTime()) / (24 * 60 * 60 * 1000))
          : 999;

        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'crawl_stopped',
          priority: daysSinceLastCheck > 30 ? 'HIGH' : 'MEDIUM',
          title: `Google não rastreia "${url.title || url.url}" há ${daysSinceLastCheck} dias`,
          description: `A página foi indexada mas o Google não a visita há ${daysSinceLastCheck} dias. Última visita: ${new Date(url.last_checked).toLocaleDateString('pt-BR')}`,
          recommendation: `1. Atualize o conteúdo para sinalizar novidade. 2. Adicione um link interno de página importante. 3. Aumente a qualidade e sinais de EAT. 4. Resubmeta no GSC.`,
          estimated_impact: 'MEDIUM',
          estimated_effort: '30_MIN',
          status: 'open',
          metrics: {
            url: url.url,
            title: url.title,
            daysSinceLastCheck,
            lastCrawl: url.last_checked,
            expectedCrawlFreq: 3,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectCrawlStopped:', error);
      return [];
    }
  }

  async detectCrawlIncreased(publicationId: string): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_indexed', true)
        .gt('last_checked', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const daysSinceLastCheck = url.last_checked
          ? Math.floor((Date.now() - new Date(url.last_checked).getTime()) / (24 * 60 * 60 * 1000))
          : 1;

        if (daysSinceLastCheck <= 1) {
          insights.push({
            publication_id: publicationId,
            site_id: url.site_id,
            user_id: url.user_id,
            type: 'crawl_increased',
            priority: 'LOW' as Priority,
            title: `✨ Google aumentou rastreamento de "${url.title || url.url}"`,
            description: `Google rastreou esta página nos últimos ${daysSinceLastCheck} dia(s). Sinal de interesse aumentado!`,
            recommendation: `Mantenha a qualidade, frequência de atualização e sinais de qualidade. Monitore comportamento de usuários para garantir satisfação.`,
            estimated_impact: 'MEDIUM',
            estimated_effort: '5_MIN',
            status: 'open',
            metrics: {
              url: url.url,
              daysSinceLastCheck,
              crawlFrequency: 'daily',
            },
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error in detectCrawlIncreased:', error);
      return [];
    }
  }

  async detectRecurringCrawlErrors(publicationId: string): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .gt('http_status', 399);

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const errorType =
          url.http_status === 404 ? 'Not Found'
          : url.http_status === 500 ? 'Server Error'
          : url.http_status === 403 ? 'Forbidden'
          : `Error ${url.http_status}`;

        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'crawl_stopped',
          priority: url.http_status >= 500 ? 'CRITICAL' : 'HIGH',
          title: `Erro de crawl recorrente: ${errorType}`,
          description: `Google encontra erro ${url.http_status} ao rastrear "${url.title || url.url}". Visitantes também enfrentam esse erro.`,
          recommendation: url.http_status === 404
            ? '1. Se intencional, configure redirecionamento 301. 2. Se não intencional, corrija a URL ou restaure conteúdo.'
            : url.http_status >= 500
            ? '1. Investigue problemas de servidor. 2. Verifique logs de erro. 3. Restaure página se estava funcionando antes.'
            : '1. Verifique permissões de acesso. 2. Certifique-se de que o conteúdo é visível. 3. Teste acesso manualmente.',
          estimated_impact: url.http_status >= 500 ? 'VERY_HIGH' : 'HIGH',
          estimated_effort: '30_MIN',
          status: 'open',
          metrics: {
            url: url.url,
            httpStatus: url.http_status,
            errorType,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectRecurringCrawlErrors:', error);
      return [];
    }
  }
}
