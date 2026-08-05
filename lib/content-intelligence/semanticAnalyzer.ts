import type { EntityAnalysis, EntityType, SearchIntent } from '@/types/content-intelligence';

export class SemanticAnalyzer {
  async analyzeContent(url: string, html: string, title?: string): Promise<{
    semantic_score: number;
    intent: SearchIntent;
    entities: EntityAnalysis[];
    topics: string[];
    headings_count: number;
    word_count: number;
    has_faq: boolean;
    has_howto: boolean;
  }> {
    const text = this.extractText(html);
    const headings = this.extractHeadings(html);
    const entities = await this.extractEntities(text);
    const topics = this.extractTopics(text, title);
    const intent = this.classifyIntent(text, title);
    const hasFaq = this.detectFaq(html);
    const hasHowto = this.detectHowto(html);

    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const headingsCount = headings.length;

    // Calculate semantic score
    const semanticScore = this.calculateSemanticScore({
      wordCount,
      headingsCount,
      entitiesCount: entities.length,
      topicsCount: topics.length,
      hasFaq,
      hasHowto,
      titleLength: title?.length || 0,
    });

    return {
      semantic_score: semanticScore,
      intent,
      entities,
      topics,
      headings_count: headingsCount,
      word_count: wordCount,
      has_faq: hasFaq,
      has_howto: hasHowto,
    };
  }

  private extractText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractHeadings(html: string): string[] {
    const headings: string[] = [];
    const matches = html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
    for (const match of matches) {
      headings.push(match[1].replace(/<[^>]+>/g, '').trim());
    }
    return headings;
  }

  private async extractEntities(text: string): Promise<EntityAnalysis[]> {
    const entities: EntityAnalysis[] = [];
    const words = text.split(/\s+/);

    // Common entity patterns (simplified - in production use NLP library)
    const entityPatterns: Array<{ pattern: RegExp; type: EntityType }> = [
      { pattern: /\b(Google|Bing|Yahoo|Baidu)\b/gi, type: 'organization' },
      { pattern: /\b(Search Console|Google Analytics|IndexNow)\b/gi, type: 'product' },
      { pattern: /\b(SEO|SEM|PPC|CRO)\b/gi, type: 'concept' },
      { pattern: /\b(Schema\.org|JSON-LD|Microdata)\b/gi, type: 'technology' },
      { pattern: /\b(Nike|Apple|Microsoft|Amazon)\b/gi, type: 'brand' },
    ];

    for (const { pattern, type } of entityPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1];
        const existing = entities.find(e => e.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          existing.frequency++;
        } else {
          entities.push({
            name,
            type,
            relevance: 0.5,
            frequency: 1,
          });
        }
      }
    }

    return entities.slice(0, 20);
  }

  private extractTopics(text: string, title?: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    // Common SEO topics
    const seoTopics = [
      'indexação', 'sitemap', 'robots.txt', 'canonical', 'schema',
      'meta description', 'título', 'h1', 'links internos', 'links externos',
      'velocidade', 'mobile', 'core web vitals', 'https', 'ssl',
      'conteúdo', 'palavra-chave', 'intenção de busca', 'snippet',
      'crawl', 'rastreamento', '排名', 'posicionamento',
    ];

    for (const topic of seoTopics) {
      if (lowerText.includes(topic)) {
        topics.push(topic);
      }
    }

    // Extract topics from title
    if (title) {
      const titleWords = title.split(/\s+/).filter(w => w.length > 4);
      topics.push(...titleWords.slice(0, 5));
    }

    return [...new Set(topics)].slice(0, 15);
  }

  private classifyIntent(text: string, title?: string): SearchIntent {
    const lowerText = (text + ' ' + (title || '')).toLowerCase();

    // Transactional indicators
    if (/\b(comprar|preço|desconto|promoção|oferta|frete|grátis)\b/i.test(lowerText)) {
      return 'transacional';
    }

    // Commercial indicators
    if (/\b(melhor|avaliação|comparar|review|top\s*\d+|lista)\b/i.test(lowerText)) {
      return 'commercial';
    }

    // Navigational indicators
    if (/\b(login|entrar|conta|suporte|contato|sobre)\b/i.test(lowerText)) {
      return 'navigational';
    }

    // Local indicators
    if (/\b(perto|próximo|localização|endereço|horário)\b/i.test(lowerText)) {
      return 'local';
    }

    // Default to informational
    return 'informational';
  }

  private detectFaq(html: string): boolean {
    return /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?["']@type["']\s*:\s*["']FAQPage["'][\s\S]*?<\/script>/i.test(html);
  }

  private detectHowto(html: string): boolean {
    return /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?["']@type["']\s*:\s*["']HowTo["'][\s\S]*?<\/script>/i.test(html);
  }

  private calculateSemanticScore(data: {
    wordCount: number;
    headingsCount: number;
    entitiesCount: number;
    topicsCount: number;
    hasFaq: boolean;
    hasHowto: boolean;
    titleLength: number;
  }): number {
    let score = 0;

    // Word count (up to 20 points)
    if (data.wordCount >= 1500) score += 20;
    else if (data.wordCount >= 1000) score += 15;
    else if (data.wordCount >= 500) score += 10;
    else if (data.wordCount >= 200) score += 5;

    // Headings (up to 15 points)
    if (data.headingsCount >= 10) score += 15;
    else if (data.headingsCount >= 6) score += 10;
    else if (data.headingsCount >= 3) score += 5;

    // Entities (up to 20 points)
    if (data.entitiesCount >= 10) score += 20;
    else if (data.entitiesCount >= 5) score += 15;
    else if (data.entitiesCount >= 2) score += 10;
    else if (data.entitiesCount >= 1) score += 5;

    // Topics (up to 15 points)
    if (data.topicsCount >= 8) score += 15;
    else if (data.topicsCount >= 5) score += 10;
    else if (data.topicsCount >= 3) score += 5;

    // FAQ/HowTo (up to 10 points)
    if (data.hasFaq) score += 5;
    if (data.hasHowto) score += 5;

    // Title quality (up to 10 points)
    if (data.titleLength >= 30 && data.titleLength <= 60) score += 10;
    else if (data.titleLength >= 20) score += 5;

    return Math.min(100, score);
  }
}