'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/common/Table';
import type { ApiKey, Site } from '@/types';
import { ApiKeyForm } from '@/components/apikeys/ApiKeyForm';
import { generateApiKey, hashApiKey } from '@/lib/api/apiKey';

export default function ApiKeysPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchApiKeys(selectedSite);
    }
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', session.user.id);

      setSites(data || []);
      if (data && data.length > 0) {
        setSelectedSite(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchApiKeys = async (siteId: string) => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (name: string, type: 'live' | 'test') => {
    try {
      const key = generateApiKey(type);
      const hashedKey = hashApiKey(key);

      await supabase.from('api_keys').insert([
        {
          site_id: selectedSite,
          name,
          key_hash: hashedKey,
          key_type: type,
        },
      ]);

      setGeneratedKey(key);
      setShowForm(false);
      await fetchApiKeys(selectedSite);
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja revogar esta chave?')) return;

    try {
      await supabase.from('api_keys').delete().eq('id', keyId);
      await fetchApiKeys(selectedSite);
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="API Keys"
        description="Gerencie chaves de acesso aos seus sites"
      >
        <Button onClick={() => setShowForm(true)}>+ Gerar Chave</Button>
      </PageHeader>

      {generatedKey && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-900 dark:text-green-400">
                Chave gerada com sucesso! Copie agora, pois não será exibida novamente.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedKey}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-md bg-white dark:bg-slate-950 border border-green-200 font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    alert('Copiado!');
                  }}
                >
                  Copiar
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGeneratedKey(null)}
              >
                OK
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <ApiKeyForm
          onCreateKey={handleCreateKey}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione um Site</label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground"
          >
            <option value="">Selecione um site...</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {selectedSite && (
          <Card>
            {loading ? (
              <CardContent>
                <div className="text-center py-8">Carregando...</div>
              </CardContent>
            ) : apiKeys.length === 0 ? (
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma chave gerada para este site
                </div>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Último Uso</TableHead>
                    <TableHead>Publicações</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700">
                          {key.key_type === 'live' ? 'Produção' : 'Teste'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleString('pt-BR')
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>{key.publications_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(key.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteKey(key.id)}
                        >
                          Revogar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
