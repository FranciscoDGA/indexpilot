'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface ReportExporterProps {
  publicationId: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

type ExportFormat = 'pdf' | 'csv' | 'json' | 'html';

export function ReportExporter({ publicationId, period = 'daily' }: ReportExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [exportProgress, setExportProgress] = useState(0);

  const formats: { id: ExportFormat; label: string; icon: string; description: string }[] = [
    {
      id: 'pdf',
      label: 'PDF',
      icon: '📄',
      description: 'Relatório formatado para impressão',
    },
    {
      id: 'csv',
      label: 'CSV',
      icon: '📊',
      description: 'Dados para análise em Excel',
    },
    {
      id: 'json',
      label: 'JSON',
      icon: '{}',
      description: 'Dados estruturados para integração',
    },
    {
      id: 'html',
      label: 'HTML',
      icon: '🌐',
      description: 'Página web interativa',
    },
  ];

  const handleExport = async (format: ExportFormat) => {
    try {
      setExporting(true);
      setExportProgress(0);
      setSelectedFormat(format);

      const response = await fetch(`/api/intelligence/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publication_id: publicationId,
          period,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao exportar relatório: ${response.statusText}`);
      }

      setExportProgress(50);

      // Get the blob
      const blob = await response.blob();
      setExportProgress(100);

      // Determine filename and type
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `relatorio-seo-${period}-${timestamp}.${format}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(0);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Falha desconhecida'}`);
      setExportProgress(0);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Relatório</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Período: <Badge className="bg-blue-100 text-blue-800">{period}</Badge>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Format Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {formats.map(fmt => (
              <button
                key={fmt.id}
                onClick={() => !exporting && setSelectedFormat(fmt.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedFormat === fmt.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={exporting}
              >
                <div className="text-2xl mb-2">{fmt.icon}</div>
                <div className="font-semibold text-sm">{fmt.label}</div>
                <p className="text-xs text-gray-600 mt-1">{fmt.description}</p>
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={() => handleExport(selectedFormat)}
            disabled={exporting}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              exporting
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {exporting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exportando... {exportProgress}%
              </div>
            ) : (
              `Exportar como ${selectedFormat.toUpperCase()}`
            )}
          </button>

          {/* Progress Bar */}
          {exporting && exportProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          )}

          {/* Format Info */}
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
            {selectedFormat === 'pdf' && (
              'PDF formatado para impressão, com gráficos e métricas em destaque.'
            )}
            {selectedFormat === 'csv' && (
              'Dados estruturados para importação em Excel ou análise adicional.'
            )}
            {selectedFormat === 'json' && (
              'API-ready JSON para integração com sistemas externos.'
            )}
            {selectedFormat === 'html' && (
              'Página web interativa que pode ser compartilhada por email.'
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
