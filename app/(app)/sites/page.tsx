'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/common/Badge';
import { SiteForm } from '@/components/sites/SiteForm';
import type { Site } from '@/types';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSite(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchSites();
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm('Tem certeza que deseja deletar este site?')) return;

    try {
      const { supabase } = await import('@/lib/supabase/client');
      await supabase.from('sites').delete().eq('id', siteId);
      fetchSites();
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meus Sites"
        description="Gerencie todos os seus sites"
      >
        <Button onClick={() => setShowForm(true)}>+ Novo Site</Button>
      </PageHeader>

      {showForm && (
        <SiteForm site={editingSite} onClose={handleFormClose} onSuccess={handleFormSuccess} />
      )}

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhum site cadastrado</p>
              <Button onClick={() => setShowForm(true)}>Criar Primeiro Site</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>{site.domain}</TableCell>
                  <TableCell>
                    <Badge variant={site.status === 'active' ? 'success' : 'warning'}>
                      {site.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(site.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/sites/${site.id}/dashboard`}>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSite(site);
                          setShowForm(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(site.id)}
                      >
                        Deletar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
