'use client';

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const variants = {
    default: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
    success: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
