import { Insight, Priority } from '@/types/intelligence';

export class ContentDetector {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async detectOutdatedContent(publicationId: string, monthsThreshold: number = 6): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_indexed', true)
        .lt('last_modified', new Date(Date.now() - monthsThreshold * 30 * 24 * 60 * 60 * 1000).toISOString());

      const insights: Insight[] = [];

      for (const url of urls || []) {
        const monthsSinceUpdate = url.last_modified
          ? Math.floor((Date.now() - new Date(url.last_modified).getTime()) / (30 * 24 * 60 * 60 * 1000))
          : 12;

        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'content_outdated',
          priority: monthsSinceUpdate > 12 ? 'HIGH' : 'MEDIUM',
          title: `Conteúdo desatualizado: "${url.title || url.url}"`,
          description: `Não foi atualizado há ${monthsSinceUpdate} meses. Google favorece conteúdo fresco. Última atualização: ${new Date(url.last_modified || '').toLocaleDateString('pt-BR')}`,
          recommendation: `Atualize as informações, estatísticas e exemplos. Adicione uma data de atualização visível. Faça com que pareça recente e relevante.`,
          estimated_impact: 'MEDIUM',
          estimated_effort: '30_MIN',
          status: 'open',
          metrics: {
            url: url.url,
            monthsSinceUpdate,
            lastModified: url.last_modified,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectOutdatedContent:', error);
      return [];
    }
  }

  async detectOrphanPages(publicationId: string): Promise<Insight[]> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId)
        .eq('is_orphaned', true)
        .eq('is_indexed', true);

      const insights: Insight[] = [];

      for (const url of urls || []) {
        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'content_missing_links',
          priority: 'HIGH' as Priority,
          title: `Página órfã (sem links internos): "${url.title || url.url}"`,
          description: `Esta página indexada não tem links internos apontando para ela. Visitantes a encontram apenas via busca.`,
          recommendation: `1. Encontre 2-3 páginas relacionadas relevantes. 2. Adicione links naturais no contexto. 3. Melhore a navegação global. 4. Páginas órfãs perdem SEO juice.`,
          estimated_impact: 'MEDIUM',
          estimated_effort: '15_MIN',
          status: 'open',
          metrics: {
            url: url.url,
            title: url.title,
            isIndexed: url.is_indexed,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectOrphanPages:', error);
      return [];
    }
  }

  async detectMissingSchema(publicationId: string): Promise<Insight[]> {
    try {
      const { data: metadata } = await this.supabaseClient
        .from('url_metadata')
        .select('*, urls(publication_id, url, title)')
        .is('schema_types', null);

      const insights: Insight[] = [];

      for (const meta of metadata || []) {
        const url = meta.urls;
        if (url?.publication_id !== publicationId) continue;

        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'content_bad_image',
          priority: 'MEDIUM' as Priority,
          title: `Schema.org ausente em "${url?.title || url?.url}"`,
          description: `Sem markup estruturado (Schema.org/JSON-LD). Google não consegue entender tipo de conteúdo ou dados estruturados.`,
          recommendation: `Adicione Schema.org apropriado (Article, NewsArticle, BlogPosting, etc). Use Google's Structured Data Markup Helper. Valide em Rich Results Test.`,
          estimated_impact: 'MEDIUM',
          estimated_effort: '15_MIN',
          status: 'open',
          metrics: {
            url: url?.url,
            title: url?.title,
            schemaRequired: true,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectMissingSchema:', error);
      return [];
    }
  }

  async detectBadFeaturedImage(publicationId: string): Promise<Insight[]> {
    try {
      const { data: metadata } = await this.supabaseClient
        .from('url_metadata')
        .select('*, urls(publication_id, url, title)')
        .is('og_image', null);

      const insights: Insight[] = [];

      for (const meta of metadata || []) {
        const url = meta.urls;
        if (url?.publication_id !== publicationId) continue;

        insights.push({
          publication_id: publicationId,
          site_id: url.site_id,
          user_id: url.user_id,
          type: 'content_bad_image',
          priority: 'MEDIUM' as Priority,
          title: `Imagem destacada ausente em "${url?.title || url?.url}"`,
          description: `Sem imagem OG (og:image). Afeta como a página aparece no Google Discover, redes sociais e buscas.`,
          recommendation: `1. Adicione og:image meta tag apontando para imagem de qualidade (1200x630px). 2. Certifique-se de que a imagem é relevante e chamativa. 3. Melhora chances em Google Discover.`,
          estimated_impact: 'MEDIUM',
          estimated_effort: '5_MIN',
          status: 'open',
          metrics: {
            url: url?.url,
            title: url?.title,
            missingOgImage: true,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectBadFeaturedImage:', error);
      return [];
    }
  }
}
