import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const { data, error } = await supabaseClient
      .from('alert_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar preferências:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar preferências' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        user_id,
        email_enabled: true,
        email_frequency: 'immediate',
        in_app_enabled: true,
        critical_only: false,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar preferências' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      email_enabled,
      email_frequency,
      in_app_enabled,
      critical_only,
      do_not_disturb_start,
      do_not_disturb_end,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const preferences = {
      user_id,
      email_enabled,
      email_frequency,
      in_app_enabled,
      critical_only,
      do_not_disturb_start,
      do_not_disturb_end,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseClient
      .from('alert_preferences')
      .upsert([preferences], { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar preferências:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar preferências' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar preferências' },
      { status: 500 }
    );
  }
}
