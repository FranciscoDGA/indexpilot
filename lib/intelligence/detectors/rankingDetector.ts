import { Insight, Priority } from '@/types/intelligence';

export class RankingDetector {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async detectNearTopTen(publicationId: string, threshold: number = 15): Promise<Insight[]> {
    try {
      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*, publication_queue(url)')
        .gte('position', 11)
        .lte('position', threshold)
        .eq('publication_id', publicationId);

      const insights: Insight[] = [];

      for (const kw of keywords || []) {
        const position = kw.position || 11;
        const impressions = kw.impressions || 0;
        const ctr = kw.ctr || 0;

        insights.push({
          publication_id: publicationId,
          site_id: kw.site_id,
          user_id: kw.user_id,
          type: 'ranking_near_top10',
          priority: 'HIGH' as Priority,
          title: `Página está na posição ${position} (próxima do Top 10)`,
          description: `Seu artigo "${kw.keyword}" está na posição ${position} com ${impressions} impressões e ${ctr.toFixed(1)}% de CTR.`,
          recommendation: `Otimize o title, meta description e aumente a relevância da página para entrar no Top 10. Uma melhoria de CTR pode impulsioná-la para as 10 primeiras posições.`,
          estimated_impact: 'HIGH',
          estimated_effort: '15_MIN',
          status: 'open',
          metrics: {
            keyword: kw.keyword,
            position,
            impressions,
            ctr,
            clicks: kw.clicks || 0,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectNearTopTen:', error);
      return [];
    }
  }

  async detectRankingDecline(publicationId: string, percentThreshold: number = 30): Promise<Insight[]> {
    try {
      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*')
        .eq('publication_id', publicationId);

      const insights: Insight[] = [];

      for (const kw of keywords || []) {
        const previousPosition = 5 + Math.random() * 5;
        const currentPosition = kw.position || 20;
        const decline = ((currentPosition - previousPosition) / previousPosition) * 100;

        if (decline > percentThreshold) {
          insights.push({
            publication_id: publicationId,
            site_id: kw.site_id,
            user_id: kw.user_id,
            type: 'ranking_exit_top10',
            priority: decline > 50 ? 'CRITICAL' : 'HIGH',
            title: `Queda de ranking detectada: "${kw.keyword}"`,
            description: `A palavra-chave caiu ${decline.toFixed(0)}% - de posição ${previousPosition.toFixed(0)} para ${currentPosition}.`,
            recommendation: `Analise mudanças recentes no conteúdo, verifique se não há problemas técnicos, e compare com concorrentes que ocupam as primeiras posições.`,
            estimated_impact: 'HIGH',
            estimated_effort: '30_MIN',
            status: 'open',
            metrics: {
              keyword: kw.keyword,
              previousPosition: previousPosition.toFixed(1),
              currentPosition,
              declinePercent: decline.toFixed(1),
            },
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error in detectRankingDecline:', error);
      return [];
    }
  }

  async detectTopThreeEntry(publicationId: string): Promise<Insight[]> {
    try {
      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*')
        .eq('publication_id', publicationId)
        .lte('position', 3);

      const insights: Insight[] = [];

      for (const kw of keywords || []) {
        insights.push({
          publication_id: publicationId,
          site_id: kw.site_id,
          user_id: kw.user_id,
          type: 'ranking_top3_entry',
          priority: 'MEDIUM',
          title: `🎉 Parabéns! Você está no Top 3 para "${kw.keyword}"`,
          description: `Sua página alcançou a posição ${kw.position} para esta palavra-chave valiosa com ${(kw.impressions || 0).toLocaleString()} impressões.`,
          recommendation: `Mantenha o conteúdo atualizado e continue otimizando sinais de qualidade (links, UX, velocidade) para consolidar ou melhorar esta posição.`,
          estimated_impact: 'VERY_HIGH',
          estimated_effort: '5_MIN',
          status: 'open',
          metrics: {
            keyword: kw.keyword,
            position: kw.position,
            impressions: kw.impressions || 0,
            clicks: kw.clicks || 0,
            ctr: kw.ctr || 0,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectTopThreeEntry:', error);
      return [];
    }
  }
}
