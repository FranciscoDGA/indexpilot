import { NextRequest, NextResponse } from 'next/server';

interface NotificationRequest {
  user_id: string;
  publication_id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  channel: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json();

    const { user_id, publication_id, type, title, message, priority, channel } = body;

    if (!user_id || !publication_id || !type || !title || !priority) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const notification = {
      user_id,
      publication_id,
      type,
      title,
      message,
      priority,
      channel: channel || 'in_app',
      read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseClient
      .from('notifications')
      .insert([notification])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar notificação:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: data,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar notificação' },
      { status: 500 }
    );
  }
}
