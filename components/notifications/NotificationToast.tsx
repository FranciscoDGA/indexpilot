'use client';

import { useEffect } from 'react';

interface NotificationToastProps {
  id: string;
  title: string;
  message?: string;
  type: 'critical' | 'high' | 'info' | 'success';
  onDismiss: (id: string) => void;
  autoClose?: boolean;
  duration?: number;
}

export function NotificationToast({
  id,
  title,
  message,
  type,
  onDismiss,
  autoClose = true,
  duration = 5000,
}: NotificationToastProps) {
  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, autoClose, duration, onDismiss]);

  const colors = {
    critical: 'bg-red-600 text-white border-red-700',
    high: 'bg-orange-600 text-white border-orange-700',
    info: 'bg-blue-600 text-white border-blue-700',
    success: 'bg-green-600 text-white border-green-700',
  };

  const icons = {
    critical: '🚨',
    high: '⚠️',
    info: 'ℹ️',
    success: '✅',
  };

  return (
    <div
      className={`${colors[type]} border-l-4 rounded-lg shadow-lg p-4 mb-3 flex items-start gap-3 animate-slide-in max-w-sm`}
      role="alert"
    >
      <div className="text-xl flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className="font-bold text-sm">{title}</p>
        {message && <p className="text-xs mt-1 opacity-90">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-white hover:opacity-75 flex-shrink-0"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
