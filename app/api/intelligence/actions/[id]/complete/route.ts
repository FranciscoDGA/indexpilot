import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { notes } = await request.json();

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const { data, error } = await supabaseClient
      .from('actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao marcar ação como completa:', error);
      return NextResponse.json(
        { error: 'Erro ao marcar ação como completa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.[0],
    });
  } catch (error) {
    console.error('Erro ao marcar ação como completa:', error);
    return NextResponse.json(
      { error: 'Erro ao marcar ação como completa' },
      { status: 500 }
    );
  }
}
