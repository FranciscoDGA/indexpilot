'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  FileText,
  Search,
  BarChart3,
  Brain,
  Zap,
  Plug,
  RefreshCw,
  FileBarChart,
  Bell,
  Activity,
  KeyRound,
  Settings,
  Radar,
  GitCompare,
  Star,
  AlertTriangle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  indent?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, section: 'Principal' },
  { href: '/sites', label: 'Sites', icon: <Globe size={18} /> },
  { href: '/publications', label: 'Publicações', icon: <FileText size={18} /> },

  { href: '/seo', label: 'SEO Inspector', icon: <Search size={18} />, section: 'SEO & Performance' },
  { href: '/seo/compare', label: 'Comparar URLs', icon: <GitCompare size={18} />, indent: true },
  { href: '/performance', label: 'Performance', icon: <Activity size={18} /> },

  { href: '/executive-dashboard', label: 'Dashboard Executivo', icon: <BarChart3 size={18} />, section: 'Inteligência' },
  { href: '/intelligence', label: 'Centro de Inteligência', icon: <Brain size={18} /> },
  { href: '/opportunities', label: 'Oportunidades', icon: <Star size={18} />, indent: true },
  { href: '/alerts', label: 'Alertas', icon: <AlertTriangle size={18} />, indent: true },

  { href: '/oge', label: 'Organic Growth Engine', icon: <Zap size={18} />, section: 'Automação' },
  { href: '/connectors', label: 'Conectores', icon: <Plug size={18} /> },
  { href: '/sync-history', label: 'Histórico de Sync', icon: <RefreshCw size={18} /> },

  { href: '/discovery', label: 'Site Discovery', icon: <Radar size={18} />, section: 'Ferramentas' },
  { href: '/reports', label: 'Relatórios', icon: <FileBarChart size={18} /> },

  { href: '/api-keys', label: 'API Keys', icon: <KeyRound size={18} />, section: 'Sistema' },
  { href: '/alert-preferences', label: 'Preferências', icon: <Bell size={18} /> },
  { href: '/settings', label: 'Configurações', icon: <Settings size={18} /> },
];

export function Sidebar() {
  const pathname = usePathname();

  let lastSection = '';

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-card border-r border-border">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">IP</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">IndexPilot</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {navItems.map((item) => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          const isActive = pathname === item.href;

          return (
            <div key={item.href}>
              {showSection && (
                <div className="px-3 pt-4 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors ${
                  item.indent ? 'pl-9 pr-3 py-1.5' : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {!item.indent && (
                  <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'}>
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
