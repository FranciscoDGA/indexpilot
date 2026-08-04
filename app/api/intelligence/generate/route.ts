import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceEngine } from '@/lib/intelligence/intelligenceEngine';

export async function POST(request: NextRequest) {
  try {
    const { publication_id } = await request.json();

    if (!publication_id) {
      return NextResponse.json(
        { error: 'publication_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();
    const engine = new IntelligenceEngine(supabaseClient);

    const insights = await engine.generateInsights(publication_id);
    const prioritized = await engine.prioritizeInsights(insights);
    const recommendations = await engine.generateRecommendations(prioritized);
    const healthScores = await engine.calculateHealthScores(publication_id);

    const { data, error } = await supabaseClient
      .from('insights')
      .insert(
        insights.map(i => ({
          publication_id: i.publication_id,
          site_id: i.site_id,
          user_id: i.user_id,
          type: i.type,
          priority: i.priority,
          title: i.title,
          description: i.description,
          recommendation: i.recommendation,
          estimated_impact: i.estimated_impact,
          estimated_effort: i.estimated_effort,
          status: i.status,
          metrics: i.metrics,
        }))
      )
      .select();

    if (error) {
      console.error('Erro ao salvar insights:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar insights' },
        { status: 500 }
      );
    }

    const { error: recError } = await supabaseClient
      .from('recommendations')
      .insert(
        recommendations.map(r => ({
          publication_id: r.publication_id,
          site_id: r.site_id,
          user_id: r.user_id,
          category: r.category,
          title: r.title,
          description: r.description,
          score: r.score,
          estimated_impact: r.estimated_impact,
          estimated_effort: r.estimated_effort,
          action_items: r.action_items,
          status: r.status,
        }))
      );

    if (recError) {
      console.error('Erro ao salvar recomendações:', recError);
      return NextResponse.json(
        { error: 'Erro ao salvar recomendações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insights_count: insights.length,
      recommendations_count: recommendations.length,
      health_scores: healthScores,
      insights: prioritized,
      recommendations,
    });
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar insights' },
      { status: 500 }
    );
  }
}
