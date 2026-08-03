'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { PublicationStatusBadge } from '@/components/publications/StatusBadge';
import { PublicationTimeline } from '@/components/publications/PublicationTimeline';
import type { PublicationQueue, PublicationEvent, PublicationLog } from '@/types';

export default function PublicationDetailsPage({ params }: { params: { id: string } }) {
  const [publication, setPublication] = useState<PublicationQueue | null>(null);
  const [events, setEvents] = useState<PublicationEvent[]>([]);
  const [logs, setLogs] = useState<PublicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const { data: pubData } = await supabase
        .from('publication_queue')
        .select('*')
        .eq('id', params.id)
        .single();

      setPublication(pubData);

      const { data: eventsData } = await supabase
        .from('publication_events')
        .select('*')
        .eq('publication_id', params.id)
        .order('created_at', { ascending: true });

      setEvents(eventsData || []);

      const { data: logsData } = await supabase
        .from('publication_logs')
        .select('*')
        .eq('publication_id', params.id)
        .order('created_at', { ascending: false });

      setLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching publication:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!publication) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Publicação não encontrada</p>
        <Link href="/publications">
          <Button>Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/publications">
          <Button variant="ghost" size="sm">
            ← Voltar
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{publication.title}</CardTitle>
            </div>
            <PublicationStatusBadge status={publication.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">URL</p>
            <p className="break-all">{publication.url}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Slug</p>
              <p>{publication.slug}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo</p>
              <p className="capitalize">{publication.type}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Recebido em</p>
            <p>{new Date(publication.created_at).toLocaleString('pt-BR')}</p>
          </div>

          {publication.error_message && (
            <div className="p-4 rounded-md bg-red-50 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-1">
                Erro
              </p>
              <p className="text-sm text-red-800 dark:text-red-300">
                {publication.error_message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum evento registrado</p>
          ) : (
            <PublicationTimeline events={events} />
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Logs Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            log.level === 'error'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : log.level === 'success'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : log.level === 'warning'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
