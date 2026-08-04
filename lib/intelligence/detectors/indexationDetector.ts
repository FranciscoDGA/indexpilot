import { Insight, Priority } from '@/types/intelligence';

export class IndexationDetector {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async detectNeverIndexed(publicationId: string): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_indexed', false)
        .gt('discovered_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const daysSinceDiscovery = Math.floor(
          (Date.now() - new Date(url.discovered_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'indexation_delayed',
          priority: daysSinceDiscovery > 14 ? 'HIGH' : 'MEDIUM',
          title: `URL não foi indexada após ${daysSinceDiscovery} dias`,
          description: `A página "${url.title || url.url}" foi descoberta há ${daysSinceDiscovery} dias mas ainda não indexou no Google.`,
          recommendation: `1. Verifique se há erros em robots.txt bloqueando a página. 2. Solicite indexação via Google Search Console. 3. Adicione links internos relevantes apontando para esta página.`,
          estimated_impact: 'HIGH',
          estimated_effort: '15_MIN',
          status: 'open',
          metrics: {
            url: url.url,
            title: url.title,
            daysSinceDiscovery,
            httpStatus: url.http_status,
            source: url.source,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectNeverIndexed:', error);
      return [];
    }
  }

  async detectLostIndexation(publicationId: string): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_orphaned', true)
        .eq('is_indexed', false);

      const insights: Insight[] = [];

      for (const url of urls || []) {
        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'indexation_lost',
          priority: 'CRITICAL' as Priority,
          title: `⚠️ Página perdeu indexação: "${url.title || url.url}"`,
          description: `Uma página que estava indexada foi removida ou ficou órfã (sem links internos). Status HTTP: ${url.http_status}`,
          recommendation: `1. Se foi removida intencionalmente, redirecione para conteúdo relevante. 2. Se é importante, adicione links internos e resubmeta para indexação. 3. Verifique se há problemas técnicos.`,
          estimated_impact: 'VERY_HIGH',
          estimated_effort: '30_MIN',
          status: 'open',
          metrics: {
            url: url.url,
            title: url.title,
            httpStatus: url.http_status,
            isOrphaned: url.is_orphaned,
            lastChecked: url.last_checked,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectLostIndexation:', error);
      return [];
    }
  }

  async detectSlowIndexation(publicationId: string, daysThreshold: number = 7): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_indexed', false)
        .lt('discovered_at', new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString());

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const daysSinceDiscovery = Math.floor(
          (Date.now() - new Date(url.discovered_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceDiscovery <= 30) {
          insights.push({
            publication_id: publicationId,
            site_id: url.site_id,
            user_id: url.user_id,
            type: 'indexation_delayed',
            priority: 'MEDIUM' as Priority,
            title: `Indexação lenta para "${url.title || url.url}"`,
            description: `Esta página ainda não indexou após ${daysSinceDiscovery} dias. Velocidade normal: 3-5 dias.`,
            recommendation: `Acelere indexação criando links internos, atualizando a página, e reiniciando crawl via Google Search Console.`,
            estimated_impact: 'MEDIUM',
            estimated_effort: '15_MIN',
            status: 'open',
            metrics: {
              url: url.url,
              daysSinceDiscovery,
              expectedDays: 5,
              delayDays: Math.max(0, daysSinceDiscovery - 5),
            },
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error in detectSlowIndexation:', error);
      return [];
    }
  }

  async detectFastIndexation(publicationId: string): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_indexed', true)
        .gt('discovered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const daysSinceDiscovery = Math.floor(
          (Date.now() - new Date(url.discovered_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceDiscovery <= 3) {
          insights.push({
            publication_id: publicationId,
            site_id: url.site_id,
            user_id: url.user_id,
            type: 'indexation_delayed',
            priority: 'LOW' as Priority,
            title: `✨ Rápida indexação para "${url.title || url.url}"`,
            description: `Parabéns! Google indexou sua página em apenas ${daysSinceDiscovery} dia(s). Seu site tem alto crawl budget e autoridade.`,
            recommendation: `Mantenha a qualidade do conteúdo, links internos e velocidade da página. Continue criando conteúdo de qualidade para consolidar essa performance.`,
            estimated_impact: 'LOW',
            estimated_effort: '5_MIN',
            status: 'open',
            metrics: {
              url: url.url,
              daysSinceDiscovery,
              fastIndexation: true,
            },
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error in detectFastIndexation:', error);
      return [];
    }
  }
}
