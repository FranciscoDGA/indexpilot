import { createClient } from '@/lib/supabase/server';
import type { CompetitiveOpportunity, ContentGapAnalysis, BenchmarkComparison } from '@/types/competitors';

export class OpportunityEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async detectOpportunities(
    workspaceId: string,
    contentGaps: ContentGapAnalysis[],
    benchmarks: BenchmarkComparison[],
    competitorPages: any[]
  ): Promise<CompetitiveOpportunity[]> {
    const opportunities: Omit<CompetitiveOpportunity, 'id' | 'created_at' | 'updated_at'>[] = [];

    // Content gap opportunities
    for (const gap of contentGaps.slice(0, 20)) {
      opportunities.push({
        workspace_id: workspaceId,
        type: 'content_gap',
        title: `Criar conteúdo sobre: ${gap.topic}`,
        description: `Concorrente tem ${gap.competitorArticles} artigos sobre "${gap.topic}", você tem ${gap.myArticles}.`,
        priority: gap.priority,
        impact: gap.gap > 5 ? 'high' : gap.gap > 2 ? 'medium' : 'low',
        effort: 'medium',
        status: 'identified',
        supporting_data: {
          topic: gap.topic,
          my_articles: gap.myArticles,
          competitor_articles: gap.competitorArticles,
          gap: gap.gap,
          competitor_urls: gap.competitorUrls,
        },
      });
    }

    // Technical improvement opportunities
    for (const benchmark of benchmarks) {
      if (benchmark.trend === 'worse') {
        const opp = this.createTechnicalOpportunity(benchmark);
        if (opp) opportunities.push(opp);
      }
    }

    // Schema adoption opportunities
    const schemaBenchmark = benchmarks.find(b => b.metric === 'schema_adoption');
    if (schemaBenchmark && schemaBenchmark.trend === 'worse') {
      const competitorSchemas = this.extractSchemaTypes(competitorPages);
      for (const schema of competitorSchemas) {
        opportunities.push({
          workspace_id: workspaceId,
          type: 'schema_adoption',
          title: `Adotar schema: ${schema}`,
          description: `Concorrente usa schema "${schema}" em suas páginas.`,
          priority: 'medium',
          impact: 'medium',
          effort: 'medium',
          status: 'identified',
          supporting_data: { schema_type: schema },
        });
      }
    }

    // Content type opportunities
    const faqBenchmark = benchmarks.find(b => b.metric === 'faq_usage');
    if (faqBenchmark && faqBenchmark.trend === 'worse') {
      opportunities.push({
        workspace_id: workspaceId,
        type: 'content_gap',
        title: 'Implementar páginas FAQ',
        description: 'Concorrente usa FAQ em suas páginas, aumentando chances de rich snippets.',
        priority: 'medium',
        impact: 'medium',
        effort: 'low',
        status: 'identified',
        supporting_data: { type: 'faq', my_value: faqBenchmark.myValue, competitor_value: faqBenchmark.competitorValue },
      });
    }

    const howtoBenchmark = benchmarks.find(b => b.metric === 'howto_usage');
    if (howtoBenchmark && howtoBenchmark.trend === 'worse') {
      opportunities.push({
        workspace_id: workspaceId,
        type: 'content_gap',
        title: 'Implementar páginas HowTo',
        description: 'Concorrente usa HowTo Schema em suas páginas.',
        priority: 'low',
        impact: 'low',
        effort: 'low',
        status: 'identified',
        supporting_data: { type: 'howto', my_value: howtoBenchmark.myValue, competitor_value: howtoBenchmark.competitorValue },
      });
    }

    // Sort by priority
    opportunities.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Save opportunities
    await this.saveOpportunities(workspaceId, opportunities);

    return opportunities as CompetitiveOpportunity[];
  }

  async getOpportunities(workspaceId: string): Promise<CompetitiveOpportunity[]> {
    const { data, error } = await this.supabase
      .from('competitive_opportunities')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateOpportunityStatus(oppId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('competitive_opportunities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', oppId);

    if (error) throw error;
  }

  private createTechnicalOpportunity(benchmark: BenchmarkComparison): Omit<CompetitiveOpportunity, 'id' | 'created_at' | 'updated_at'> | null {
    const metricDescriptions: Record<string, { title: string; description: string; impact: 'high' | 'medium' | 'low'; effort: 'high' | 'medium' | 'low' }> = {
      total_urls: {
        title: 'Expandir cobertura de conteúdo',
        description: `Concorrente tem ${benchmark.competitorValue} URLs vs suas ${benchmark.myValue}.`,
        impact: 'high',
        effort: 'high',
      },
      avg_depth: {
        title: 'Melhorar profundidade do site',
        description: `Profundidade média do concorrente: ${benchmark.competitorValue} vs sua: ${benchmark.myValue}.`,
        impact: 'medium',
        effort: 'medium',
      },
      orphan_pages: {
        title: 'Reduzir páginas órfãs',
        description: `Concorrente tem ${benchmark.competitorValue} páginas órfãs vs suas ${benchmark.myValue}.`,
        impact: 'medium',
        effort: 'low',
      },
      avg_word_count: {
        title: 'Aumentar profundidade do conteúdo',
        description: `Média de palavras do concorrente: ${benchmark.competitorValue} vs sua: ${benchmark.myValue}.`,
        impact: 'medium',
        effort: 'medium',
      },
    };

    const config = metricDescriptions[benchmark.metric];
    if (!config) return null;

    return {
      workspace_id: '',
      type: 'technical_improvement',
      title: config.title,
      description: config.description,
      priority: config.impact === 'high' ? 'high' : 'medium',
      impact: config.impact,
      effort: config.effort,
      status: 'identified',
      supporting_data: {
        metric: benchmark.metric,
        my_value: benchmark.myValue,
        competitor_value: benchmark.competitorValue,
        difference: benchmark.difference,
        percentage: benchmark.percentage,
      },
    };
  }

  private extractSchemaTypes(pages: any[]): string[] {
    const schemas = new Set<string>();
    for (const page of pages) {
      if (page.schema_types) {
        for (const schema of page.schema_types) {
          schemas.add(schema);
        }
      }
    }
    return Array.from(schemas);
  }

  private async saveOpportunities(workspaceId: string, opportunities: Omit<CompetitiveOpportunity, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    // Delete old identified opportunities
    await this.supabase
      .from('competitive_opportunities')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('status', 'identified');

    // Insert new opportunities
    if (opportunities.length > 0) {
      const { error } = await this.supabase
        .from('competitive_opportunities')
        .insert(opportunities);

      if (error) throw error;
    }
  }
}