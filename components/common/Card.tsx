'use client';

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
