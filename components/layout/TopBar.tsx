'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/common/Button';
import type { User } from '@/types';

export function TopBar({ user }: { user: User | null }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="border-b border-border bg-card h-16 flex items-center justify-between px-6">
      <div className="flex-1">
        <h2 className="text-sm font-medium text-muted-foreground">Bem-vindo</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="text-2xl">👤</span>
            <span className="text-sm font-medium">{user?.full_name || user?.email}</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-50">
              <a
                href="/profile"
                className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-t-lg"
              >
                Perfil
              </a>
              <a
                href="/settings"
                className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Configurações
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted rounded-b-lg"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
