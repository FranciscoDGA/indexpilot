'use client';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-border ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border bg-muted/50">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`border-b border-border hover:bg-muted/50 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-3 text-left font-semibold text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-3 ${className}`}>{children}</td>;
}
