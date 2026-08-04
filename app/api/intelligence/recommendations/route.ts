import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publication_id = searchParams.get('publication_id');
    const status = searchParams.get('status') || 'active';

    if (!publication_id) {
      return NextResponse.json(
        { error: 'publication_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const { data, error, count } = await supabaseClient
      .from('recommendations')
      .select('*')
      .eq('publication_id', publication_id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar recomendações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar recomendações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar recomendações' },
      { status: 500 }
    );
  }
}
