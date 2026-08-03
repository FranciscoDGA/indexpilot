'use client';

import { Badge } from '@/components/common/Badge';
import type { PublicationStatus } from '@/types';

const statusConfig: Record<
  PublicationStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' }
> = {
  RECEIVED: { label: 'Recebido', variant: 'info' },
  PROCESSING: { label: 'Processando', variant: 'warning' },
  INDEXED: { label: 'Indexado', variant: 'success' },
  ERROR: { label: 'Erro', variant: 'error' },
};

export function PublicationStatusBadge({ status }: { status: PublicationStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
