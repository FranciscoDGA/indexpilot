'use client';

import { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  color?: string;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted hover:border-primary/30 transition-all group"
        >
          <span className={action.color || 'text-muted-foreground'}>{action.icon}</span>
          <span>{action.label}</span>
          <ArrowRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
}