'use client';

import { useState, useEffect } from 'react';
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
  TrendingUp,
  Database,
  SearchCode,
  Cpu,
  DollarSign,
  Compass,
  TestTube2,
  BrainCircuit,
  Target,
  Route,
  CalendarCheck,
  BookOpen,
  Microscope,
  ChevronRight,
} from 'lucide-react';

interface NavChild {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavChild[];
}

const sections: NavSection[] = [
  {
    id: 'principal',
    label: 'Principal',
    icon: <LayoutDashboard size={18} />,
    children: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
      { href: '/sites', label: 'Sites', icon: <Globe size={14} /> },
      { href: '/publications', label: 'Publicações', icon: <FileText size={14} /> },
    ],
  },
  {
    id: 'seo',
    label: 'SEO & Performance',
    icon: <Search size={18} />,
    children: [
      { href: '/seo', label: 'SEO Inspector', icon: <Search size={14} /> },
      { href: '/seo/compare', label: 'Comparar URLs', icon: <GitCompare size={14} /> },
      { href: '/performance', label: 'Performance', icon: <Activity size={14} /> },
    ],
  },
  {
    id: 'inteligencia',
    label: 'Inteligência',
    icon: <BarChart3 size={18} />,
    children: [
      { href: '/executive-dashboard', label: 'Dashboard Executivo', icon: <BarChart3 size={14} /> },
      { href: '/intelligence', label: 'Centro de Inteligência', icon: <Brain size={14} /> },
      { href: '/opportunities', label: 'Oportunidades', icon: <Star size={14} /> },
      { href: '/alerts', label: 'Alertas', icon: <AlertTriangle size={14} /> },
    ],
  },
  {
    id: 'automacao',
    label: 'Automação',
    icon: <Zap size={18} />,
    children: [
      { href: '/oge', label: 'Organic Growth Engine', icon: <Zap size={14} /> },
      { href: '/connectors', label: 'Conectores', icon: <Plug size={14} /> },
      { href: '/sync-history', label: 'Histórico de Sync', icon: <RefreshCw size={14} /> },
    ],
  },
  {
    id: 'ferramentas',
    label: 'Ferramentas',
    icon: <Radar size={18} />,
    children: [
      { href: '/discovery', label: 'Site Discovery', icon: <Radar size={14} /> },
      { href: '/reports', label: 'Relatórios', icon: <FileBarChart size={14} /> },
    ],
  },
  {
    id: 'analytics',
    label: 'Data Warehouse & BI',
    icon: <TrendingUp size={18} />,
    children: [
      { href: '/analytics', label: 'Executive Analytics', icon: <TrendingUp size={14} /> },
      { href: '/analytics/seo', label: 'SEO Analytics', icon: <SearchCode size={14} /> },
      { href: '/analytics/content', label: 'Content Analytics', icon: <Database size={14} /> },
      { href: '/analytics/competitors', label: 'Competitor Analytics', icon: <Compass size={14} /> },
      { href: '/analytics/financial', label: 'Financial Analytics', icon: <DollarSign size={14} /> },
      { href: '/analytics/ai', label: 'AI Analytics', icon: <Cpu size={14} /> },
      { href: '/analytics/data-explorer', label: 'Data Explorer', icon: <TestTube2 size={14} /> },
    ],
  },
  {
    id: 'aiops',
    label: 'AI Operations Center',
    icon: <BrainCircuit size={18} />,
    children: [
      { href: '/ai/mission-control', label: 'Mission Control', icon: <BrainCircuit size={14} /> },
      { href: '/ai/strategies', label: 'AI Strategies', icon: <Route size={14} /> },
      { href: '/ai/goals', label: 'AI Goals', icon: <Target size={14} /> },
      { href: '/ai/briefings', label: 'AI Briefings', icon: <CalendarCheck size={14} /> },
      { href: '/ai/memory', label: 'AI Memory', icon: <BookOpen size={14} /> },
      { href: '/ai/simulations', label: 'Scenario Simulator', icon: <Microscope size={14} /> },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: <Settings size={18} />,
    children: [
      { href: '/api-keys', label: 'API Keys', icon: <KeyRound size={14} /> },
      { href: '/alert-preferences', label: 'Preferências', icon: <Bell size={14} /> },
      { href: '/settings', label: 'Configurações', icon: <Settings size={14} /> },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const active = sections.find(s =>
      s.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    );
    if (active) {
      setExpanded(prev => new Set([...prev, active.id]));
    }
  }, [pathname]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isChildActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-card border-r border-border">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">IP</span>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">IndexPilot</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {sections.map((section) => {
          const isOpen = expanded.has(section.id);
          const hasActiveChild = section.children?.some(c => isChildActive(c.href));
          const activeChild = section.children?.find(c => isChildActive(c.href));

          return (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => toggle(section.id)}
                className={`w-full flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors px-3 py-2 ${
                  hasActiveChild && !isOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span className="text-muted-foreground">{section.icon}</span>
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronRight
                  size={14}
                  className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {isOpen && section.children && (
                <div className="ml-3 mt-0.5 border-l border-border pl-2">
                  {section.children.map((child) => {
                    const active = isChildActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 rounded-md text-[12px] font-medium transition-colors px-3 py-1.5 ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className={active ? 'text-primary-foreground' : 'text-muted-foreground'}>
                          {child.icon}
                        </span>
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}