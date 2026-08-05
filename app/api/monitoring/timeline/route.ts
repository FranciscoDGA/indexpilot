import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const siteId = searchParams.get('site_id') || 'site-1';
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build timeline from monitoring_events + incidents + change_history
  const [eventsResult, incidentsResult, changesResult] = await Promise.all([
    supabase
      .from('monitoring_events')
      .select('*')
      .eq('site_id', siteId)
      .order('detected_at', { ascending: false })
      .limit(200),
    supabase
      .from('incidents')
      .select('*')
      .eq('site_id', siteId)
      .order('opened_at', { ascending: false })
      .limit(50),
    supabase
      .from('change_history')
      .select('*')
      .eq('site_id', siteId)
      .order('detected_at', { ascending: false })
      .limit(100),
  ]);

  const events = eventsResult.data || [];
  const incidents = incidentsResult.data || [];
  const changes = changesResult.data || [];

  // Map to timeline format
  const timeline: any[] = [];

  for (const event of events) {
    timeline.push({
      id: event.id,
      site_id: event.site_id,
      category: event.event_type.split('.')[0],
      title: event.event_type,
      severity: event.severity,
      metadata: event.payload,
      timestamp: event.detected_at,
    });
  }

  for (const incident of incidents) {
    timeline.push({
      id: incident.id,
      site_id: incident.site_id,
      category: 'alert',
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      metadata: incident.metadata,
      timestamp: incident.opened_at,
    });
  }

  for (const change of changes) {
    timeline.push({
      id: change.id,
      site_id: change.site_id,
      category: 'content',
      title: `${change.field} ${change.change_type}`,
      description: change.url,
      severity: 'low' as const,
      metadata: { field: change.field, old_value: change.old_value, new_value: change.new_value },
      timestamp: change.detected_at,
    });
  }

  // Sort by timestamp desc
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter by category if provided
  const filtered = category ? timeline.filter(t => t.category === category) : timeline;

  return Response.json({
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  });
}