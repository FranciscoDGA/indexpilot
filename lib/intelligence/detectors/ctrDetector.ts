import { Insight, Priority } from '@/types/intelligence';

export class CtrDetector {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async detectVeryLowCtr(publicationId: string, ctrThreshold: number = 1): Promise<Insight[]> {
    try {
      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*')
        .eq('publication_id', publicationId)
        .lt('ctr', ctrThreshold);

      const insights: Insight[] = [];

      for (const kw of keywords || []) {
        const ctr = kw.ctr || 0;
        const expectedCtr = Math.max(2, kw.position ? 10 - kw.position : 3);

        insights.push({
          publication_id: publicationId,
          site_id: kw.site_id,
          user_id: kw.user_id,
          type: 'ctr_very_low',
          priority: kw.position && kw.position <= 10 ? 'HIGH' : 'MEDIUM',
          title: `CTR muito baixo para "${kw.keyword}" (${ctr.toFixed(1)}%)`,
          description: `Palavra-chave na posição ${kw.position} com ${(kw.impressions || 0).toLocaleString()} impressões mas apenas ${ctr.toFixed(1)}% de CTR. Esperado: ${expectedCtr}%+`,
          recommendation: `Reescreva o title e meta description para melhorar relevância percebida. Use números, palavras-chave, e call-to-action claros para aumentar clicks.`,
          estimated_impact: 'HIGH',
          estimated_effort: '5_MIN',
          status: 'open',
          metrics: {
            keyword: kw.keyword,
            position: kw.position,
            currentCtr: ctr.toFixed(1),
            expectedCtr: expectedCtr.toFixed(1),
            impressions: kw.impressions || 0,
            clicks: kw.clicks || 0,
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectVeryLowCtr:', error);
      return [];
    }
  }

  async detectCtrDecline(publicationId: string, declinePercent: number = 25): Promise<Insight[]> {
    try {
      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*')
        .eq('publication_id', publicationId)
        .gt('ctr', 0.5);

      const insights: Insight[] = [];

      for (const kw of keywords || []) {
        const previousCtr = kw.ctr ? kw.ctr * 1.3 : 2.5;
        const currentCtr = kw.ctr || 1;
        const decline = ((previousCtr - currentCtr) / previousCtr) * 100;

        if (decline > declinePercent) {
          insights.push({
            publication_id: publicationId,
            site_id: kw.site_id,
            user_id: kw.user_id,
            type: 'ctr_decreased',
            priority: 'MEDIUM' as Priority,
            title: `Queda de CTR: "${kw.keyword}" perdeu ${decline.toFixed(0)}%`,
            description: `CTR caiu de ~${previousCtr.toFixed(1)}% para ${currentCtr.toFixed(1)}% nesta palavra-chave com ${(kw.impressions || 0).toLocaleString()} impressões.`,
            recommendation: `Concorrentes podem ter melhorado seus snippets. Atualize o title/meta description com termos mais atrativos ou adicione rich snippets para aumentar visibilidade.`,
            estimated_impact: 'MEDIUM',
            estimated_effort: '15_MIN',
            status: 'open',
            metrics: {
              keyword: kw.keyword,
              position: kw.position,
              previousCtr: previousCtr.toFixed(1),
              currentCtr: currentCtr.toFixed(1),
              declinePercent: decline.toFixed(1),
            },
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error in detectCtrDecline:', error);
      return [];
    }
  }

  async detectHighImpressionLowCtr(publicationId: string): Promise<Insight[]> {
    try {
      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*')
        .eq('publication_id', publicationId)
        .gte('impressions', 500)
        .lt('ctr', 2);

      const insights: Insight[] = [];

      for (const kw of keywords || []) {
        const missedClicks = ((kw.impressions || 0) * 0.05) - (kw.clicks || 0);

        insights.push({
          publication_id: publicationId,
          site_id: kw.site_id,
          user_id: kw.user_id,
          type: 'ctr_very_low',
          priority: 'HIGH' as Priority,
          title: `Grande oportunidade CTR: "${kw.keyword}"`,
          description: `${(kw.impressions || 0).toLocaleString()} impressões mas apenas ${(kw.clicks || 0)} clicks (${(kw.ctr || 0).toFixed(1)}%). Você pode ganhar ~${Math.round(missedClicks)} clicks adicionais.`,
          recommendation: `Este é um quick win! Reescreva o snippet para melhorar apelo visual. Aumente o CTR de ${(kw.ctr || 0).toFixed(1)}% para 3-5% facilmente.`,
          estimated_impact: 'VERY_HIGH',
          estimated_effort: '5_MIN',
          status: 'open',
          metrics: {
            keyword: kw.keyword,
            position: kw.position,
            impressions: kw.impressions || 0,
            clicks: kw.clicks || 0,
            currentCtr: (kw.ctr || 0).toFixed(1),
            potentialClicks: Math.round(missedClicks),
          },
        });
      }

      return insights;
    } catch (error) {
      console.error('Error in detectHighImpressionLowCtr:', error);
      return [];
    }
  }
}
