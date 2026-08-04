'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrphanPage {
  url: string;
  inbound_links: number;
  traffic: number;
  potential_traffic: number;
  priority: string;
}

interface MeshData {
  totalPages: number;
  orphanPages: number;
  avgLinksPerPage: number;
  meshStrength: number;
}

export default function InternalLinking() {
  const searchParams = useSearchParams();
  const publicationId = searchParams.get('publication_id') || '';
  const [orphans, setOrphans] = useState<OrphanPage[]>([]);
  const [mesh, setMesh] = useState<MeshData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/oge/links/orphans?publication_id=${publicationId}`
        );
        const data = await res.json();
        setOrphans(data.data || []);
        setMesh(data.mesh || null);
      } catch (err) {
        console.error('Error loading orphan pages:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) loadData();
  }, [publicationId]);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href={`/oge?publication_id=${publicationId}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar ao OGE
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Internal Linking
        </h1>
        <p className="text-gray-600">
          Gerencie sua malha de links internos
        </p>
      </div>

      {/* Mesh Strength Overview */}
      {mesh && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Total de Páginas</span>
            <div className="text-3xl font-bold text-gray-900">
              {mesh.totalPages}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Páginas Órfãs</span>
            <div className="text-3xl font-bold text-red-600">
              {mesh.orphanPages}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Média de Links</span>
            <div className="text-3xl font-bold text-gray-900">
              {mesh.avgLinksPerPage.toFixed(1)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <span className="text-gray-500 text-sm">Força da Malha</span>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(mesh.meshStrength)}%
            </div>
          </div>
        </div>
      )}

      {/* Orphan Pages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Páginas Órfãs
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Páginas sem links internos que precisam ser resgatadas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  Tráfego
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  Potencial
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orphans.map((orphan, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-blue-600 truncate">
                    {orphan.url}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getPriorityColor(orphan.priority)}`}>
                      {orphan.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                    {orphan.traffic.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">
                    +{orphan.potential_traffic.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      Sugerir Links
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orphans.length === 0 && (
          <div className="p-8 text-center text-gray-600">
            Excelente! Nenhuma página órfã detectada.
          </div>
        )}
      </div>
    </div>
  );
}
