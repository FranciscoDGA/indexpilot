'use client';

import type { PublicationEvent } from '@/types';

export function PublicationTimeline({ events }: { events: PublicationEvent[] }) {
  const eventLabels: Record<string, string> = {
    received: 'Recebido',
    validated: 'Validado',
    saved: 'Salvo',
    queued: 'Enfileirado',
    processing: 'Processando',
    indexed: 'Indexado',
    error: 'Erro',
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line and dot */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary" />
            {index < events.length - 1 && <div className="w-0.5 h-12 bg-border" />}
          </div>

          {/* Event content */}
          <div className="pb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {eventLabels[event.event] || event.event}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(event.created_at).toLocaleTimeString('pt-BR')}
              </span>
            </div>
            {event.metadata && (
              <div className="mt-2 text-sm text-muted-foreground">
                {event.metadata.message && (
                  <p>{event.metadata.message}</p>
                )}
                {event.metadata.ip && (
                  <p>IP: {event.metadata.ip}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
