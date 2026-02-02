'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, User, Search, ChevronRight, Phone } from 'lucide-react';
import Link from 'next/link';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await api.clientes.getAll();
        const data = Array.isArray(res) ? res : res.data || [];
        setClientes(data);
      } catch (error) {
        console.error('Error fetching clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter(c =>
    c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.idNumber?.includes(searchTerm)
  );

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
            <h1 className="text-lg font-semibold text-gray-900">Clientes</h1>
          </div>
          <Link
            href="/dashboard/clientes/nuevo"
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all touch-manipulation"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
        <p className="text-sm text-purple-700">
          <span className="font-semibold">{filteredClientes.length}</span> clientes encontrados
        </p>
      </div>

      {/* Clientes List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">No hay clientes</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm ? 'No se encontraron resultados' : 'Crea tu primer cliente'}
            </p>
            {!searchTerm && (
              <Link
                href="/dashboard/clientes/nuevo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Crear cliente
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClientes.map((cliente) => (
              <Link
                key={cliente.id}
                href={`/dashboard/clientes/${cliente.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {cliente.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{cliente.fullName}</p>
                    <p className="text-sm text-gray-500">CC: {cliente.idNumber}</p>
                    {cliente.phone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {cliente.phone}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
