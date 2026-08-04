'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import Link from 'next/link';

interface AlertPreferences {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  in_app_enabled: boolean;
  critical_only: boolean;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
}

export default function AlertPreferencesPage() {
  const [preferences, setPreferences] = useState<AlertPreferences>({
    user_id: 'user-1',
    email_enabled: true,
    email_frequency: 'immediate',
    in_app_enabled: true,
    critical_only: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/alert-preferences?user_id=user-1');

        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        } else {
          setError('Erro ao carregar preferências');
        }
      } catch (err) {
        console.error('Erro ao carregar preferências:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      const response = await fetch('/api/alert-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar preferências');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando preferências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Preferências de Alertas</h1>
          <p className="text-gray-600 mt-1">Configure como e quando receber notificações</p>
        </div>
        <Link href="/intelligence" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Voltar
        </Link>
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {saved && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-800">✓ Preferências salvas com sucesso!</p>
          </CardContent>
        </Card>
      )}

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔔 Notificações no Aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.in_app_enabled}
              onChange={e =>
                setPreferences({
                  ...preferences,
                  in_app_enabled: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Habilitar notificações</p>
              <p className="text-sm text-gray-600">Receber alertas em tempo real no aplicativo</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📧 Notificações por Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={e =>
                setPreferences({
                  ...preferences,
                  email_enabled: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Habilitar notificações por email</p>
              <p className="text-sm text-gray-600">Receber alertas no seu email</p>
            </div>
          </label>

          {preferences.email_enabled && (
            <div className="pl-12 space-y-2 border-l-2 border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Frequência de Email:</p>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="email_frequency"
                  value="immediate"
                  checked={preferences.email_frequency === 'immediate'}
                  onChange={e =>
                    setPreferences({
                      ...preferences,
                      email_frequency: e.target.value as 'immediate' | 'daily' | 'weekly',
                    })
                  }
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  <strong>Imediato</strong> - Alertas críticos enviados logo
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="email_frequency"
                  value="daily"
                  checked={preferences.email_frequency === 'daily'}
                  onChange={e =>
                    setPreferences({
                      ...preferences,
                      email_frequency: e.target.value as 'immediate' | 'daily' | 'weekly',
                    })
                  }
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  <strong>Diário</strong> - Resumo diário pela manhã
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="email_frequency"
                  value="weekly"
                  checked={preferences.email_frequency === 'weekly'}
                  onChange={e =>
                    setPreferences({
                      ...preferences,
                      email_frequency: e.target.value as 'immediate' | 'daily' | 'weekly',
                    })
                  }
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  <strong>Semanal</strong> - Resumo semanal às segundas
                </span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Filtros de Alerta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.critical_only}
              onChange={e =>
                setPreferences({
                  ...preferences,
                  critical_only: e.target.checked,
                })
              }
              className="w-5 h-5 text-red-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Apenas alertas críticos</p>
              <p className="text-sm text-gray-600">Receber notificações apenas de problemas críticos</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌙 Modo Silencioso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Escolha um período para não receber notificações
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Início (HH:mm)
              </label>
              <input
                type="time"
                value={preferences.do_not_disturb_start || ''}
                onChange={e =>
                  setPreferences({
                    ...preferences,
                    do_not_disturb_start: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fim (HH:mm)
              </label>
              <input
                type="time"
                value={preferences.do_not_disturb_end || ''}
                onChange={e =>
                  setPreferences({
                    ...preferences,
                    do_not_disturb_end: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {preferences.do_not_disturb_start && preferences.do_not_disturb_end && (
            <p className="text-sm text-gray-600 mt-2">
              📵 Modo silencioso ativo de{' '}
              <strong>{preferences.do_not_disturb_start}</strong> a{' '}
              <strong>{preferences.do_not_disturb_end}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">📋 Resumo das Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Notificações no app:</strong>{' '}
            <Badge className={preferences.in_app_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {preferences.in_app_enabled ? 'Ativada' : 'Desativada'}
            </Badge>
          </p>
          <p>
            <strong>Emails:</strong>{' '}
            <Badge className={preferences.email_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {preferences.email_enabled ? 'Ativado' : 'Desativado'}
            </Badge>{' '}
            {preferences.email_enabled && (
              <span className="text-gray-600">({preferences.email_frequency})</span>
            )}
          </p>
          <p>
            <strong>Filtro:</strong>{' '}
            <Badge className={preferences.critical_only ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
              {preferences.critical_only ? 'Apenas críticas' : 'Todos os níveis'}
            </Badge>
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 justify-end">
        <Link
          href="/intelligence"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? '💾 Salvando...' : '💾 Salvar Preferências'}
        </button>
      </div>
    </div>
  );
}
