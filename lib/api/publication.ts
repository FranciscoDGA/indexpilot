import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { PublishRequest } from './validation';

export async function createPublication(
  siteId: string,
  data: PublishRequest,
  ip: string
): Promise<{
  success: boolean;
  publicationId?: string;
  error?: string;
  code?: string;
}> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Check for duplicates
    const { data: existing, error: checkError } = await supabase
      .from('publication_queue')
      .select('id')
      .eq('site_id', siteId)
      .eq('url', data.url)
      .neq('status', 'ERROR')
      .limit(1)
      .single();

    if (existing && !checkError) {
      return {
        success: false,
        error: 'URL already published for this site',
        code: 'DUPLICATE_URL',
      };
    }

    // Create publication
    const publicationId = uuidv4();
    const { error: insertError } = await supabase
      .from('publication_queue')
      .insert([
        {
          id: publicationId,
          site_id: siteId,
          url: data.url,
          title: data.title,
          slug: data.slug,
          type: data.type,
          status: 'RECEIVED',
          next_step: 'GOOGLE_INDEX',
          priority: 0,
        },
      ]);

    if (insertError) {
      console.error('Insert publication error:', insertError);
      return {
        success: false,
        error: 'Failed to create publication',
        code: 'INTERNAL_ERROR',
      };
    }

    // Create initial log
    await createPublicationLog(publicationId, 'Publication received from API', 'info', { ip });

    // Create events
    await createPublicationEvent(publicationId, 'received', { ip });

    return { success: true, publicationId };
  } catch (error) {
    console.error('Create publication error:', error);
    return {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
  }
}

export async function createPublicationLog(
  publicationId: string,
  message: string,
  level: 'info' | 'warning' | 'error' | 'success',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    await supabase.from('publication_logs').insert([
      {
        id: uuidv4(),
        publication_id: publicationId,
        message,
        level,
        metadata,
      },
    ]);
  } catch (error) {
    console.error('Create publication log error:', error);
  }
}

export async function createPublicationEvent(
  publicationId: string,
  event: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    await supabase.from('publication_events').insert([
      {
        id: uuidv4(),
        publication_id: publicationId,
        event,
        metadata,
      },
    ]);
  } catch (error) {
    console.error('Create publication event error:', error);
  }
}
