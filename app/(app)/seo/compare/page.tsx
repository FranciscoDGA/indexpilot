'use client';

import React, { useEffect, useState } from 'react';
import { ScoreGauge } from '@/components/seo/ScoreGauge';
import { HistoryChart } from '@/components/seo/HistoryChart';
import { X } from 'lucide-react';

interface SeoAudit {
  id: string;
  publication_id: string;
  url: string;
  score: number;
  grade: string;
  status: string;
  scanned_at: string;
  seo_checks?: any[];
}

interface HistoryData {
  date: string;
  score: number;
  grade: string;
}

export default function ComparePage() {
  const [allAudits, setAllAudits] = useState<SeoAudit[]>([]);
  const [selectedAudits, setSelectedAudits] = useState<SeoAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(true);

  useEffect(() => {
    async function fetchAudits() {
      try {
        const res = await fetch('/api/audits/scan?id=all');
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        const audits = data.audit ? [data.audit] : data.audits || [];
        setAllAudits(audits);

        // Auto-select first 3 audits
        if (audits.length >= 1) {
          setSelectedAudits(audits.slice(0, Math.min(3, audits.length)));
          setShowSelector(false);
        }
      } catch (error) {
        console.error('Error fetching audits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAudits();
  }, []);

  const handleSelectAudit = (audit: SeoAudit) => {
    if (selectedAudits.find(a => a.id === audit.id)) {
      setSelectedAudits(selectedAudits.filter(a => a.id !== audit.id));
    } else if (selectedAudits.length < 5) {
      setSelectedAudits([...selectedAudits, audit]);
    }
  };

  const handleRemoveAudit = (auditId: string) => {
    setSelectedAudits(selectedAudits.filter(a => a.id !== auditId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando auditorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Comparar URLs
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Compare scores, problemas e histórico de até 5 URLs
        </p>
      </div>

      {/* Selected URLs */}
      {selectedAudits.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              URLs Selecionadas ({selectedAudits.length}/5)
            </h2>
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showSelector ? 'Esconder seletor' : 'Adicionar mais'}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedAudits.map(audit => (
              <div
                key={audit.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {audit.url}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {audit.seo_checks?.length || 0} checks
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAudit(audit.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-shrink-0">
                    <ScoreGauge score={audit.score} grade={audit.grade} size="sm" showLabel={true} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {audit.score}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(audit.scanned_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Selector */}
      {showSelector && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Selecione URLs para Comparar
          </h2>

          {allAudits.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma auditoria disponível
            </p>
          ) : (
            <div className="space-y-2">
              {allAudits.map(audit => {
                const isSelected = !!selectedAudits.find(a => a.id === audit.id);
                const isDisabled =
                  selectedAudits.length >= 5 && !isSelected;

                return (
                  <label
                    key={audit.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${
                      isDisabled
                        ? 'bg-gray-100 opacity-50 dark:bg-gray-800'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectAudit(audit)}
                      disabled={isDisabled}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {audit.url}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Score: {audit.score} ({audit.grade})
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {selectedAudits.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Tabela Comparativa
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Métrica
                  </th>
                  {selectedAudits.map(audit => (
                    <th
                      key={audit.id}
                      className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white"
                    >
                      <p className="truncate text-xs">{audit.url}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    Score
                  </td>
                  {selectedAudits.map(audit => (
                    <td key={audit.id} className="px-4 py-3 text-center">
                      <span className="inline-block rounded-lg bg-blue-100 px-3 py-1 font-bold text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                        {audit.score}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    Grade
                  </td>
                  {selectedAudits.map(audit => {
                    const gradeColor =
                      audit.grade === 'A+' || audit.grade === 'A'
                        ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200'
                        : audit.grade === 'B'
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                        : audit.grade === 'C'
                        ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-200';

                    return (
                      <td key={audit.id} className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-lg px-3 py-1 font-bold ${gradeColor}`}>
                          {audit.grade}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    Status
                  </td>
                  {selectedAudits.map(audit => (
                    <td key={audit.id} className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {audit.status === 'completed'
                          ? 'Completado'
                          : 'Pendente'}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    Problemas
                  </td>
                  {selectedAudits.map(audit => (
                    <td key={audit.id} className="px-4 py-3 text-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        {audit.seo_checks?.filter(c => c.status !== 'PASS').length || 0}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    Última Auditoria
                  </td>
                  {selectedAudits.map(audit => (
                    <td key={audit.id} className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                      {new Date(audit.scanned_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Score Comparison Chart */}
      {selectedAudits.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Comparação Visual de Scores
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {selectedAudits.map(audit => (
              <div
                key={audit.id}
                className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <h3 className="text-center text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {audit.url}
                </h3>
                <ScoreGauge
                  score={audit.score}
                  grade={audit.grade}
                  size="md"
                  showLabel={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
