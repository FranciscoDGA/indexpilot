'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ReportExporter } from '@/components/intelligence/ReportExporter';
import Link from 'next/link';

interface Report {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  generated_at: string;
  health_score: number;
  insights_count: number;
  critical_count: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const siteId = 'site-1';
  const publicationId = 'pub-1';

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/intelligence/reports?publication_id=${publicationId}&period=${selectedPeriod}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar relatórios');
        }

        const data = await response.json();
        const mockReports: Report[] = [
          {
            id: 'report-1',
            period: 'daily',
            generated_at: new Date().toISOString(),
            health_score: 75,
            insights_count: 12,
            critical_count: 2,
          },
          {
            id: 'report-2',
            period: 'daily',
            generated_at: new Date(Date.now() - 86400000).toISOString(),
            health_score: 72,
            insights_count: 14,
            critical_count: 3,
          },
          {
            id: 'report-3',
            period: 'weekly',
            generated_at: new Date(Date.now() - 604800000).toISOString(),
            health_score: 70,
            insights_count: 45,
            critical_count: 5,
          },
          {
            id: 'report-4',
            period: 'monthly',
            generated_at: new Date(Date.now() - 2592000000).toISOString(),
            health_score: 65,
            insights_count: 120,
            critical_count: 12,
          },
        ];

        setReports(mockReports.filter(r => r.period === selectedPeriod));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
        console.error('Erro ao carregar relatórios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [publicationId, selectedPeriod]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Moderado';
    return 'Crítico';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Histórico de Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Visualize e exporte histórico de relatórios SEO
          </p>
        </div>
        <Link
          href="/intelligence"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Voltar para Centro de Inteligência
        </Link>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Novo Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportExporter publicationId={publicationId} period={selectedPeriod} />
        </CardContent>
      </Card>

      {/* Period Filter */}
      <div className="flex gap-3">
        <button
          onClick={() => setSelectedPeriod('daily')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedPeriod === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Diários
        </button>
        <button
          onClick={() => setSelectedPeriod('weekly')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedPeriod === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Semanais
        </button>
        <button
          onClick={() => setSelectedPeriod('monthly')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedPeriod === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mensais
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Carregando relatórios...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Erro: {error}</p>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 py-8">
              Nenhum relatório disponível para este período
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-sm text-gray-600">Data</p>
                    <p className="font-medium">
                      {new Date(report.generated_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.generated_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Saúde SEO</p>
                    <Badge className={getHealthColor(report.health_score)}>
                      {report.health_score}% - {getHealthLabel(report.health_score)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Insights</p>
                    <p className="font-medium">{report.insights_count} descobertas</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Críticas</p>
                    <p className={`font-medium ${report.critical_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {report.critical_count} problema{report.critical_count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => window.location.href = `/api/intelligence/reports/export?publication_id=${publicationId}&period=${selectedPeriod}&format=pdf`}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      title="Baixar como PDF"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => window.location.href = `/api/intelligence/reports/export?publication_id=${publicationId}&period=${selectedPeriod}&format=csv`}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Baixar como CSV"
                    >
                      📊 CSV
                    </button>
                    <button
                      onClick={() => window.location.href = `/api/intelligence/reports/export?publication_id=${publicationId}&period=${selectedPeriod}&format=json`}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      title="Baixar como JSON"
                    >
                      {} JSON
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">💡 Dica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>PDF:</strong> Relatório formatado para impressão, ideal para compartilhar com stakeholders
          </p>
          <p>
            <strong>CSV:</strong> Dados estruturados para análise adicional em Excel ou ferramentas de BI
          </p>
          <p>
            <strong>JSON:</strong> Formato estruturado para integração com sistemas externos
          </p>
          <p>
            <strong>HTML:</strong> Página web interativa que pode ser visualizada no navegador ou enviada por email
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
