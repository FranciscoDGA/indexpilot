import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import {
  createCriticalAlertTemplate,
  createDailyDigestTemplate,
  createWeeklyReportTemplate,
} from '@/lib/templates/emailTemplates';

interface EmailNotificationRequest {
  user_id: string;
  publication_id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationRequest = await request.json();

    const {
      user_id,
      publication_id,
      type,
      title,
      message,
      priority,
      metadata,
    } = body;

    if (!user_id || !publication_id || !type) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      );
    }

    const supabaseClient: any = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
      ? (await import('@/lib/supabase/mock')).createMockSupabaseClient()
      : (await import('@/lib/supabase/server')).createClient();

    const userEmail = await getUserEmail(supabaseClient, user_id);

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email de usuário não encontrado' },
        { status: 404 }
      );
    }

    let emailId: string;

    switch (type) {
      case 'critical_alert':
        emailId = await sendCriticalAlertEmail(
          userEmail,
          publication_id,
          metadata || {}
        );
        break;

      case 'daily_digest':
        emailId = await sendDailyDigestEmail(
          userEmail,
          publication_id,
          metadata || {}
        );
        break;

      case 'weekly_report':
        emailId = await sendWeeklyReportEmail(
          userEmail,
          publication_id,
          metadata || {}
        );
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de email desconhecido: ${type}` },
          { status: 400 }
        );
    }

    const emailLog = {
      user_id,
      publication_id,
      type,
      email_id: emailId,
      status: 'queued',
      created_at: new Date().toISOString(),
    };

    await supabaseClient
      .from('email_logs')
      .insert([emailLog])
      .catch((err: any) => console.error('Erro ao registrar log:', err));

    return NextResponse.json({
      success: true,
      email_id: emailId,
      recipient: userEmail,
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    );
  }
}

async function getUserEmail(
  supabaseClient: any,
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar email do usuário:', error);
      return null;
    }

    return data?.email || null;
  } catch (error) {
    console.error('Erro ao buscar email:', error);
    return null;
  }
}

async function sendCriticalAlertEmail(
  userEmail: string,
  publicationId: string,
  metadata: Record<string, any>
): Promise<string> {
  const publication = metadata.publication || publicationId;
  const insights = metadata.insights || [];
  const healthScores = metadata.health_scores || {
    overall_health: 0,
    growth_potential: 0,
    index_velocity: 0,
    content_freshness: 0,
  };

  const template = createCriticalAlertTemplate(publication, insights, healthScores);
  return emailService.sendEmailTemplate(userEmail, template);
}

async function sendDailyDigestEmail(
  userEmail: string,
  publicationId: string,
  metadata: Record<string, any>
): Promise<string> {
  const publication = metadata.publication || publicationId;
  const insights = metadata.insights || [];
  const recommendations = metadata.recommendations || [];
  const healthScores = metadata.health_scores || {
    overall_health: 0,
    growth_potential: 0,
    index_velocity: 0,
    content_freshness: 0,
  };

  const template = createDailyDigestTemplate(
    publication,
    insights,
    recommendations,
    healthScores
  );
  return emailService.sendEmailTemplate(userEmail, template);
}

async function sendWeeklyReportEmail(
  userEmail: string,
  publicationId: string,
  metadata: Record<string, any>
): Promise<string> {
  const publication = metadata.publication || publicationId;
  const insights = metadata.insights || [];
  const recommendations = metadata.recommendations || [];
  const healthScores = metadata.health_scores || {
    overall_health: 0,
    growth_potential: 0,
    index_velocity: 0,
    content_freshness: 0,
  };

  const template = createWeeklyReportTemplate(
    publication,
    insights,
    recommendations,
    healthScores
  );
  return emailService.sendEmailTemplate(userEmail, template);
}
