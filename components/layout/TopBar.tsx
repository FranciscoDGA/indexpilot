'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import type { User as UserType } from '@/types';

export function TopBar({ user }: { user: UserType | null }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase/client');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-3" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-3 hover:bg-muted transition-colors"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
            {user?.full_name || user?.email || 'User'}
          </span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        {showMenu && (
          <div className="absolute right-6 top-12 w-56 rounded-lg border border-border bg-popover shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-sm font-medium text-foreground truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setShowMenu(false); router.push('/profile'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <User size={15} className="text-muted-foreground" />
                Perfil
              </button>
              <button
                onClick={() => { setShowMenu(false); router.push('/settings'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings size={15} className="text-muted-foreground" />
                Configurações
              </button>
            </div>
            <div className="border-t border-border py-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
