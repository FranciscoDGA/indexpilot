'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/sites', label: 'Sites', icon: '🌐' },
  { href: '/publications', label: 'Publicações', icon: '📝' },
  { href: '/discovery', label: 'Site Discovery', icon: '🔎' },
  { href: '/seo', label: 'SEO Inspector', icon: '🔍' },
  { href: '/seo/compare', label: 'Comparar URLs', icon: '⚖️', indent: true },
  { href: '/executive-dashboard', label: 'Dashboard Executivo', icon: '📈' },
  { href: '/intelligence', label: 'Centro de Inteligência', icon: '🧠' },
  { href: '/opportunities', label: 'Oportunidades', icon: '⭐', indent: true },
  { href: '/alerts', label: 'Alertas', icon: '🚨', indent: true },
  { href: '/reports', label: 'Relatórios', icon: '📋' },
  { href: '/alert-preferences', label: 'Preferências de Alertas', icon: '🔔' },
  { href: '/performance', label: 'Performance', icon: '📊' },
  { href: '/api-keys', label: 'API Keys', icon: '🔑' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-xl font-bold">IndexPilot</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item: any) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg transition-colors ${
              item.indent ? 'pl-8 py-1.5 px-4' : 'px-4 py-2'
            } ${
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {!item.indent && <span>{item.icon}</span>}
            <span className={item.indent ? 'text-xs font-medium' : 'text-sm font-medium'}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
