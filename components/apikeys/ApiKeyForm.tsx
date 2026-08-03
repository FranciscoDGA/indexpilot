'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface ApiKeyFormProps {
  onCreateKey: (name: string, type: 'live' | 'test') => void;
  onClose: () => void;
}

export function ApiKeyForm({ onCreateKey, onClose }: ApiKeyFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'live' | 'test'>('live');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      onCreateKey(name, type);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerar Nova Chave</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Chave</label>
            <Input
              type="text"
              placeholder="ex: API Produção"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="live"
                  checked={type === 'live'}
                  onChange={(e) => setType(e.target.value as 'live' | 'test')}
                  disabled={loading}
                />
                <span className="text-sm">Produção</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="test"
                  checked={type === 'test'}
                  onChange={(e) => setType(e.target.value as 'live' | 'test')}
                  disabled={loading}
                />
                <span className="text-sm">Teste</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Gerando...' : 'Gerar Chave'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
