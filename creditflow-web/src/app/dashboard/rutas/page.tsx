'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, MapPin, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RutasPage() {
  const router = useRouter();
  const [rutas, setRutas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await api.rutas.getAll();
        const data = res;
        setRutas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching rutas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRutas();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Rutas</h1>
          </div>
          <Link
            href="/dashboard/rutas/nueva"
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
        <p className="text-sm text-purple-700">
          <span className="font-semibold">{rutas.length}</span> rutas registradas
        </p>
      </div>

      {/* Rutas List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : rutas.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">No hay rutas</p>
            <p className="text-gray-500 text-sm mb-6">Crea tu primera ruta</p>
            <Link
              href="/dashboard/rutas/nueva"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Crear ruta
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rutas.map((ruta) => (
              <Link
                key={ruta.id}
                href={`/dashboard/rutas/${ruta.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ruta.name}</p>
                    {ruta.description && (
                      <p className="text-sm text-gray-500">{ruta.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ruta.active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {ruta.active ? 'Activa' : 'Inactiva'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
