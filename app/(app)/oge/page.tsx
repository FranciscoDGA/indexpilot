'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OGEStats {
  ctr_gaps: number;
  orphan_pages: number;
  cluster_gaps: number;
  freshness_opportunities: number;
  decay_alerts: number;
}

export default function OGEDashboard() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [stats, setStats] = useState<OGEStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicationId) {
      setError('Publication ID is required');
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const [ctrRes, linksRes, clusterRes, freshnessRes, decayRes] = await Promise.all([
          fetch(`/api/oge/ctr/analyze?publication_id=${publicationId}`),
          fetch(`/api/oge/links/orphans?publication_id=${publicationId}`),
          fetch(`/api/oge/clusters/gaps?publication_id=${publicationId}`),
          fetch(`/api/oge/freshness/opportunities?publication_id=${publicationId}`),
          fetch(`/api/oge/decay/alerts?publication_id=${publicationId}`),
        ]);

        const ctrData = await ctrRes.json();
        const linksData = await linksRes.json();
        const clusterData = await clusterRes.json();
        const freshnessData = await freshnessRes.json();
        const decayData = await decayRes.json();

        setStats({
          ctr_gaps: ctrData.count || 0,
          orphan_pages: linksData.count || 0,
          cluster_gaps: clusterData.count || 0,
          freshness_opportunities: freshnessData.count || 0,
          decay_alerts: decayData.count || 0,
        });
      } catch (err) {
        console.error('Error loading OGE stats:', err);
        setError('Failed to load OGE statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [publicationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading Organic Growth Engine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Organic Growth Engine
        </h1>
        <p className="text-gray-600">
          Estratégias completas de crescimento para seu site
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Link href={`/oge/ctr?publication_id=${publicationId}`}>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats?.ctr_gaps || 0}
            </div>
            <h3 className="font-semibold text-gray-700">CTR Gaps</h3>
            <p className="text-sm text-gray-500">Keywords to optimize</p>
          </div>
        </Link>

        <Link href={`/oge/links?publication_id=${publicationId}`}>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats?.orphan_pages || 0}
            </div>
            <h3 className="font-semibold text-gray-700">Orphan Pages</h3>
            <p className="text-sm text-gray-500">Pages without links</p>
          </div>
        </Link>

        <Link href={`/oge/clusters?publication_id=${publicationId}`}>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats?.cluster_gaps || 0}
            </div>
            <h3 className="font-semibold text-gray-700">Cluster Gaps</h3>
            <p className="text-sm text-gray-500">Incomplete topics</p>
          </div>
        </Link>

        <Link href={`/oge/freshness?publication_id=${publicationId}`}>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats?.freshness_opportunities || 0}
            </div>
            <h3 className="font-semibold text-gray-700">Stale Content</h3>
            <p className="text-sm text-gray-500">Updates needed</p>
          </div>
        </Link>

        <Link href={`/oge/decay?publication_id=${publicationId}`}>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {stats?.decay_alerts || 0}
            </div>
            <h3 className="font-semibold text-gray-700">Decay Alerts</h3>
            <p className="text-sm text-gray-500">Declining content</p>
          </div>
        </Link>
      </div>

      {/* Module Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">CTR Optimization</h3>
          <p className="text-sm text-blue-800 mb-3">
            Identifica lacunas entre CTR esperado e atual. Gera sugestões de títulos e meta descriptions otimizadas.
          </p>
          <Link
            href={`/oge/ctr?publication_id=${publicationId}`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Explorar →
          </Link>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <h3 className="font-bold text-orange-900 mb-2">Internal Linking</h3>
          <p className="text-sm text-orange-800 mb-3">
            Detecta páginas órfãs, sugere links relevantes e visualiza a força da sua malha interna.
          </p>
          <Link
            href={`/oge/links?publication_id=${publicationId}`}
            className="text-sm font-semibold text-orange-600 hover:text-orange-800"
          >
            Explorar →
          </Link>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="font-bold text-purple-900 mb-2">Topic Clusters</h3>
          <p className="text-sm text-purple-800 mb-3">
            Agrupa keywords por tópicos semânticos, calcula completude e identifica artigos faltantes.
          </p>
          <Link
            href={`/oge/clusters?publication_id=${publicationId}`}
            className="text-sm font-semibold text-purple-600 hover:text-purple-800"
          >
            Explorar →
          </Link>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-900 mb-2">Freshness Engine</h3>
          <p className="text-sm text-green-800 mb-3">
            Detecta conteúdo desatualizado, correlaciona com posição no SERP e previne impacto de atualizações.
          </p>
          <Link
            href={`/oge/freshness?publication_id=${publicationId}`}
            className="text-sm font-semibold text-green-600 hover:text-green-800"
          >
            Explorar →
          </Link>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200 md:col-span-2">
          <h3 className="font-bold text-red-900 mb-2">Content Decay Engine</h3>
          <p className="text-sm text-red-800 mb-3">
            Detecta declínio gradual de desempenho, analisa causas raiz e recomenda estratégias de recuperação.
          </p>
          <Link
            href={`/oge/decay?publication_id=${publicationId}`}
            className="text-sm font-semibold text-red-600 hover:text-red-800"
          >
            Explorar →
          </Link>
        </div>
      </div>
    </div>
  );
}
