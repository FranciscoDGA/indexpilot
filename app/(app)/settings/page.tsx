'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import type { User } from '@/types';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    theme: 'system' as 'light' | 'dark' | 'system',
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUser(data);
        setFormData({
          fullName: data.full_name || '',
          language: data.language,
          timezone: data.timezone,
          theme: data.theme,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          language: formData.language,
          timezone: formData.timezone,
          theme: formData.theme,
        })
        .eq('id', user.id);

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      await fetchUser();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao salvar configurações',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Gerenciar configurações da sua conta"
      />

      {message && (
        <Card
          className={
            message.type === 'success'
              ? 'border-green-200 bg-green-50 dark:bg-green-950/30'
              : 'border-red-200 bg-red-50 dark:bg-red-950/30'
          }
        >
          <CardContent>
            <p
              className={
                message.type === 'success'
                  ? 'text-green-900 dark:text-green-400'
                  : 'text-red-900 dark:text-red-400'
              }
            >
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nome Completo</label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Idioma</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              disabled={saving}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fuso Horário</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              disabled={saving}
              className="w-full px-4 py-2 border border-input rounded-md bg-background"
            >
              <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
              <option value="America/New_York">New York (UTC-5)</option>
              <option value="Europe/London">London (UTC+0)</option>
              <option value="Europe/Paris">Paris (UTC+1)</option>
              <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tema</label>
            <div className="space-y-2">
              {(['light', 'dark', 'system'] as const).map((themeOption) => (
                <label key={themeOption} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={themeOption}
                    checked={formData.theme === themeOption}
                    onChange={(e) =>
                      setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' | 'system' })
                    }
                    disabled={saving}
                  />
                  <span className="text-sm capitalize">
                    {themeOption === 'light' ? 'Claro' : themeOption === 'dark' ? 'Escuro' : 'Sistema'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  );
}
