import type { AdvisorResponse, BenchmarkComparison, ContentGapAnalysis, CompetitiveOpportunity } from '@/types/competitors';

export class AIAdvisor {
  async answerQuestion(
    question: string,
    competitors: any[],
    benchmarks: BenchmarkComparison[],
    contentGaps: ContentGapAnalysis[],
    opportunities: CompetitiveOpportunity[],
    mySiteStats: any
  ): Promise<AdvisorResponse> {
    const lowerQuestion = question.toLowerCase();

    let answer = '';
    let supportingData: Record<string, any> = {};
    const recommendations: string[] = [];
    let confidence = 0.8;

    // Qual concorrente evoluiu mais este mês?
    if (lowerQuestion.includes('evoluiu mais') || lowerQuestion.includes('cresceu mais')) {
      answer = this.analyzeMostEvolved(competitors, benchmarks);
      supportingData = { competitors: competitors.map(c => c.name) };
      recommendations.push('Analise os padrões de crescimento dos concorrentes para identificar oportunidades');
    }

    // Quais categorias ainda não possuo?
    else if (lowerQuestion.includes('categorias') || lowerQuestion.includes('não possuo')) {
      answer = this.analyzeMissingCategories(contentGaps);
      supportingData = { content_gaps: contentGaps.length };
      recommendations.push('Priorize categorias com maior volume de concorrência');
    }

    // Onde estou melhor?
    else if (lowerQuestion.includes('melhor') || lowerQuestion.includes('vantagem')) {
      answer = this.analyzeAdvantages(benchmarks);
      supportingData = { benchmarks: benchmarks.filter(b => b.trend === 'better').length };
      recommendations.push('Mantenha suas vantagens competitivas focando na qualidade');
    }

    // Onde estou pior?
    else if (lowerQuestion.includes('pior') || lowerQuestion.includes('desvantagem')) {
      answer = this.analyzeDisadvantages(benchmarks);
      supportingData = { benchmarks: benchmarks.filter(b => b.trend === 'worse').length };
      recommendations.push('Foque nas melhorias de maior impacto primeiro');
    }

    // O que devo produzir primeiro?
    else if (lowerQuestion.includes('produzir') || lowerQuestion.includes('criar') || lowerQuestion.includes('priorizar')) {
      answer = this.analyzePriorities(opportunities, contentGaps);
      supportingData = { opportunities: opportunities.length };
      recommendations.push('Comece por conteúdos com maior potencial de impacto');
    }

    // Qual concorrente mudou mais?
    else if (lowerQuestion.includes('mudou') || lowerQuestion.includes('alterou')) {
      answer = this.analyzeMostChanged(competitors);
      supportingData = { competitors: competitors.map(c => c.name) };
      recommendations.push('Acompanhe mudanças de concorrentes para identificar tendências');
    }

    // Comparison general
    else if (lowerQuestion.includes('compar') || lowerQuestion.includes('diferen')) {
      answer = this.analyzeGeneralComparison(benchmarks, mySiteStats);
      supportingData = { benchmarks };
      recommendations.push('Use dados específicos para tomar decisões');
    }

    // Default response
    else {
      answer = this.generateDefaultAnswer(benchmarks, contentGaps, opportunities);
      supportingData = { benchmarks: benchmarks.length, gaps: contentGaps.length, opportunities: opportunities.length };
      recommendations.push('Faça perguntas mais específicas para obter análises detalhadas');
      confidence = 0.6;
    }

    return {
      question,
      answer,
      supporting_data: supportingData,
      recommendations,
      confidence,
    };
  }

  private analyzeMostEvolved(competitors: any[], benchmarks: BenchmarkComparison[]): string {
    if (competitors.length === 0) {
      return 'Não há dados de concorrentes suficientes para análise.';
    }

    const urlBenchmark = benchmarks.find(b => b.metric === 'total_urls');
    if (urlBenchmark) {
      return `Baseado no número de páginas, o concorrente com mais conteúdo tem ${urlBenchmark.competitorValue} URLs. Recomenda-se analisar a taxa de crescimento mensal para identificar quem está evoluindo mais rápido.`;
    }

    return 'Analise os dados de crawl recentes para identificar padrões de crescimento.';
  }

  private analyzeMissingCategories(gaps: ContentGapAnalysis[]): string {
    if (gaps.length === 0) {
      return 'Não foram identificados gaps significativos de conteúdo.';
    }

    const highPriority = gaps.filter(g => g.priority === 'high');
    const mediumPriority = gaps.filter(g => g.priority === 'medium');

    let response = `Foram identificados ${gaps.length} gaps de conteúdo.`;
    if (highPriority.length > 0) {
      response += ` ${highPriority.length} de alta prioridade: ${highPriority.slice(0, 3).map(g => g.topic).join(', ')}.`;
    }
    if (mediumPriority.length > 0) {
      response += ` ${mediumPriority.length} de média prioridade.`;
    }

    return response;
  }

  private analyzeAdvantages(benchmarks: BenchmarkComparison[]): string {
    const advantages = benchmarks.filter(b => b.trend === 'better');

    if (advantages.length === 0) {
      return 'Não foram encontradas vantagens claras nos indicadores atuais.';
    }

    const advantageList = advantages.map(b => {
      const metricNames: Record<string, string> = {
        schema_adoption: 'Adoção de Schema',
        canonical_usage: 'Uso de Canonical',
        avg_word_count: 'Profundidade do Conteúdo',
        breadcrumb_adoption: 'Breadcrumbs',
        faq_usage: 'FAQ',
        howto_usage: 'HowTo',
      };
      return metricNames[b.metric] || b.metric;
    }).join(', ');

    return `Suas vantagens atuais estão em: ${advantageList}. Continue investindo nessas áreas.`;
  }

  private analyzeDisadvantages(benchmarks: BenchmarkComparison[]): string {
    const disadvantages = benchmarks.filter(b => b.trend === 'worse');

    if (disadvantages.length === 0) {
      return 'Seu site está performando bem em todos os indicadores comparados.';
    }

    const disadvantageList = disadvantages.map(b => {
      const metricNames: Record<string, string> = {
        total_urls: 'Volume de Conteúdo',
        schema_adoption: 'Adoção de Schema',
        avg_depth: 'Profundidade',
        orphan_pages: 'Páginas Órfãs',
        avg_word_count: 'Tamanho do Conteúdo',
      };
      return metricNames[b.metric] || b.metric;
    }).join(', ');

    return `Áreas para melhoria: ${disadvantageList}. Priorize melhorias nessas áreas.`;
  }

  private analyzePriorities(opportunities: CompetitiveOpportunity[], gaps: ContentGapAnalysis[]): string {
    if (opportunities.length === 0) {
      return 'Não há oportunidades identificadas no momento.';
    }

    const highPriority = opportunities.filter(o => o.priority === 'high');
    const contentOpps = opportunities.filter(o => o.type === 'content_gap');
    const technicalOpps = opportunities.filter(o => o.type === 'technical_improvement');

    let response = `Existem ${opportunities.length} oportunidades identificadas.`;
    if (highPriority.length > 0) {
      response += ` ${highPriority.length} de alta prioridade.`;
    }
    if (contentOpps.length > technicalOpps.length) {
      response += ' Recomenda-se focar em conteúdo primeiro.';
    } else {
      response += ' Recomenda-se melhorias técnicas primeiro.';
    }

    return response;
  }

  private analyzeMostChanged(competitors: any[]): string {
    if (competitors.length === 0) {
      return 'Não há dados de concorrentes para análise.';
    }

    return 'Analise o timeline de mudanças para identificar concorrentes mais ativos. Considere monitorar semanalmente para detectar padrões.';
  }

  private analyzeGeneralComparison(benchmarks: BenchmarkComparison[], mySiteStats: any): string {
    if (benchmarks.length === 0) {
      return 'Dados insuficientes para comparação.';
    }

    const better = benchmarks.filter(b => b.trend === 'better').length;
    const worse = benchmarks.filter(b => b.trend === 'worse').length;
    const equal = benchmarks.filter(b => b.trend === 'equal').length;

    return `Comparação geral: ${better} indicadores melhores, ${worse} piores, ${equal} iguais. ${better > worse ? 'Seu site está competitivo.' : 'Há espaço para melhoria.'}`;
  }

  private generateDefaultAnswer(benchmarks: BenchmarkComparison[], gaps: ContentGapAnalysis[], opportunities: CompetitiveOpportunity[]): string {
    return `Análise disponível: ${benchmarks.length} benchmarks, ${gaps.length} gaps de conteúdo, ${opportunities.length} oportunidades. Faça perguntas específicas para análises detalhadas.`;
  }
}