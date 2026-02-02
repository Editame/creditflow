'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosApi, rutasApi } from '@/lib/api';
import { formatBusinessDate } from '@/lib/timezone';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function PrestamosPage() {
  const router = useRouter();
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'ACTIVO' | 'MORA' | 'PAGADO'>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [collapsedClients, setCollapsedClients] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [rutas, setRutas] = useState<any[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<number | null>(null);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedRuta, filter]);

  useEffect(() => {
    const fetchPrestamos = async () => {
      try {
        const allRes = await prestamosApi.getAll({ limit: 1000 });
        const allData = allRes.data?.data?.data || allRes.data?.data || allRes.data;
        setPrestamos(Array.isArray(allData) ? allData : []);
      } catch (error) {
        console.error('Error fetching prestamos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchRutas = async () => {
      try {
        const res = await rutasApi.getAll();
        const data = res.data?.data || res.data;
        setRutas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching rutas:', error);
      }
    };
    fetchPrestamos();
    fetchRutas();
  }, [limit]);

  const filteredPrestamos = prestamos.filter((p) => {
    const matchesFilter = filter === 'todos' || p.estado === filter;
    if (!matchesFilter) return false;

    const matchesRuta = selectedRuta === null || p.cliente?.routeId === selectedRuta;
    if (!matchesRuta) return false;

    if (searchTerm.trim() === '') return true;

    const search = searchTerm.toLowerCase().trim();
    const nombreCliente = p.cliente?.fullName?.toLowerCase() || '';
    const cedulaCliente = p.cliente?.idNumber?.toLowerCase() || '';

    return nombreCliente.includes(search) || cedulaCliente.includes(search);
  });

  const prestamosPorCliente = filteredPrestamos.reduce((acc, prestamo) => {
    if (!prestamo.cliente) return acc;
    
    const clienteId = prestamo.cliente.id;
    if (!acc[clienteId]) {
      acc[clienteId] = {
        cliente: prestamo.cliente,
        prestamos: [],
        stats: { activos: 0, mora: 0, pagados: 0, total: 0 }
      };
    }
    
    acc[clienteId].prestamos.push(prestamo);
    acc[clienteId].stats.total++;
    
    switch (prestamo.estado) {
      case 'ACTIVO':
        acc[clienteId].stats.activos++;
        break;
      case 'MORA':
        acc[clienteId].stats.mora++;
        break;
      case 'PAGADO':
        acc[clienteId].stats.pagados++;
        break;
    }
    
    return acc;
  }, {} as Record<number, { cliente: any; prestamos: any[]; stats: { activos: number; mora: number; pagados: number; total: number } }>);

  const toggleClientCollapse = (clienteId: number) => {
    setCollapsedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clienteId)) {
        newSet.delete(clienteId);
      } else {
        newSet.add(clienteId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'MORA':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'PAGADO':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusStyle = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-purple-100 text-purple-700';
      case 'MORA':
        return 'bg-red-100 text-red-700';
      case 'PAGADO':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    activos: filteredPrestamos.filter((p) => p.estado === 'ACTIVO').length,
    mora: filteredPrestamos.filter((p) => p.estado === 'MORA').length,
    pagados: filteredPrestamos.filter((p) => p.estado === 'PAGADO').length,
  };

  const prestamosPorRuta = prestamos.reduce((acc, p) => {
    const rutaId = p.cliente?.routeId;
    if (rutaId) {
      acc[rutaId] = (acc[rutaId] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPrestamos = filteredPrestamos.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Préstamos</h1>
          </div>
          <Link
            href="/dashboard/prestamos/nuevo"
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {[
            { key: 'todos', label: 'Todos', count: filteredPrestamos.length },
            { key: 'ACTIVO', label: 'Activos', count: stats.activos },
            { key: 'MORA', label: 'En mora', count: stats.mora },
            { key: 'PAGADO', label: 'Pagados', count: stats.pagados },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Ruta Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mt-2">
          <button
            onClick={() => setSelectedRuta(null)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedRuta === null
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            Todas las rutas
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              selectedRuta === null
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {prestamos.length}
            </span>
          </button>
          {rutas.map((ruta) => (
            <button
              key={ruta.id}
              onClick={() => setSelectedRuta(ruta.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedRuta === ruta.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {ruta.name}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                selectedRuta === ruta.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {prestamosPorRuta[ruta.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 pb-1 -mx-4 px-4 mt-2">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Por Cliente
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Lista
          </button>
        </div>
      </div>

      {/* Prestamos List */}
      <div className="p-4">
        {/* Stats */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredPrestamos.length)}</span> de <span className="font-semibold">{filteredPrestamos.length}</span> préstamos
          </p>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="text-sm px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium"
          >
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPrestamos.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">No hay préstamos</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm
                ? `No se encontraron resultados para "${searchTerm}"`
                : filter !== 'todos'
                ? 'No hay préstamos con este estado'
                : 'Crea tu primer préstamo'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          viewMode === 'grouped' ? (
            <div className="space-y-3">
              {Object.values(prestamosPorCliente).slice(startIndex, endIndex).map(({ cliente, prestamos: clientPrestamos, stats }) => {
                const isCollapsed = collapsedClients.has(cliente.id);
                const totalPrestado = clientPrestamos.reduce((sum, p) => sum + Number(p.montoPrestado), 0);
                const totalSaldo = clientPrestamos.reduce((sum, p) => sum + Number(p.saldoPendiente), 0);

                return (
                  <div key={cliente.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => toggleClientCollapse(cliente.id)}
                      className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between active:bg-gray-50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-lg">
                            {cliente.fullName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{cliente.fullName}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{stats.total} préstamos</span>
                            <span>•</span>
                            <span>${totalPrestado.toLocaleString()} prestado</span>
                            <span>•</span>
                            <span className="font-medium text-purple-600">${totalSaldo.toLocaleString()} saldo</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          {stats.activos > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              {stats.activos} activos
                            </span>
                          )}
                          {stats.mora > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              {stats.mora} mora
                            </span>
                          )}
                          {stats.pagados > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {stats.pagados} pagados
                            </span>
                          )}
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="border-t border-gray-100 divide-y divide-gray-100">
                        {clientPrestamos.map((prestamo) => (
                          <Link
                            key={prestamo.id}
                            href={`/dashboard/prestamos/${prestamo.id}`}
                            className="block p-3 active:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(prestamo.estado)}
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(prestamo.estado)}`}>
                                  {prestamo.estado}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {prestamo.frecuenciaPago === 'DIARIO' ? 'Diario' : 'Semanal'}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-gray-500">Prestado</p>
                                <p className="font-semibold text-gray-900">
                                  ${Number(prestamo.montoPrestado).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Cuota</p>
                                <p className="font-semibold text-gray-900">
                                  ${Number(prestamo.valorCuota).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Saldo</p>
                                <p className="font-semibold text-purple-600">
                                  ${Number(prestamo.saldoPendiente).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedPrestamos.map((prestamo) => (
                <Link
                  key={prestamo.id}
                  href={`/dashboard/prestamos/${prestamo.id}`}
                  className="block p-4 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(prestamo.estado)}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(prestamo.estado)}`}>
                        {prestamo.estado}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {prestamo.frecuenciaPago === 'DIARIO' ? 'Diario' : 'Semanal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {prestamo.cliente?.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {prestamo.cliente?.fullName || 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Inicio: {formatBusinessDate(prestamo.fechaInicio)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Prestado</p>
                      <p className="font-semibold text-gray-900">
                        ${Number(prestamo.montoPrestado).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cuota</p>
                      <p className="font-semibold text-gray-900">
                        ${Number(prestamo.valorCuota).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Saldo</p>
                      <p className="font-semibold text-purple-600">
                        ${Number(prestamo.saldoPendiente).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {filteredPrestamos.length > limit && (
        <div className="px-4 pb-6">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Página {page} de {Math.ceil(filteredPrestamos.length / limit)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(filteredPrestamos.length / limit), p + 1))}
              disabled={page === Math.ceil(filteredPrestamos.length / limit)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
