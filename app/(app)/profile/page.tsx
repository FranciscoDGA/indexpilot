'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { User } from '@/types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Perfil"
        description="Informações da sua conta"
      />

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg">{user?.email}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome</p>
            <p className="text-lg">{user?.full_name || 'Não informado'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
            <p className="text-lg">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR')
                : '-'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Idioma</p>
            <p className="text-lg">
              {user?.language === 'pt-BR' ? 'Português (Brasil)' : user?.language}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Fuso Horário</p>
            <p className="text-lg">{user?.timezone}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/settings">
            <Button variant="outline" className="w-full">
              Editar Configurações
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
