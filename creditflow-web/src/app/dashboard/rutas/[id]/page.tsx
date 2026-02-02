'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  MapPin,
  Users,
  DollarSign,
  Plus,
  ChevronRight,
  TrendingUp,
  Wallet,
  Receipt,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function RutaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const rutaId = parseInt(params.id as string);
  
  const [ruta, setRuta] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', active: true });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rutaRes, clientesRes] = await Promise.all([
          api.rutas.getOne(rutaId),
          api.clientes.getAll(),
        ]);
        
        const rutaData = rutaRes.data || rutaRes;
        setRuta(rutaData);
        setFormData({
          name: rutaData.name || '',
          description: rutaData.description || '',
          active: rutaData.active !== false,
        });
        
        const clientesData = Array.isArray(clientesRes) ? clientesRes : clientesRes.data || [];
        // Filtrar clientes de esta ruta
        setClientes(clientesData.filter((c: any) => c.routeId === rutaId));
      } catch (error) {
        console.error('Error fetching ruta:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (rutaId) fetchData();
  }, [rutaId]);

  const handleUpdate = async () => {
    try {
      await api.rutas.update(rutaId, formData);
      const res = await api.rutas.getOne(rutaId);
      setRuta(res.data || res);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating ruta:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta ruta?')) return;
    try {
      await api.rutas.delete(rutaId);
      router.push('/dashboard/rutas');
    } catch (error) {
      console.error('Error deleting ruta:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ruta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Ruta no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-4 pt-4 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Detalle de Ruta</h1>
        </div>

        {/* Ruta Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{ruta.name}</h2>
            {ruta.description && (
              <p className="text-purple-100 text-sm">{ruta.description}</p>
            )}
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
              ruta.active 
                ? 'bg-green-400 text-green-900' 
                : 'bg-red-400 text-red-900'
            }`}>
              {ruta.active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-14 space-y-4 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-500">Clientes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-500">Activos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{clientes.filter(c => c.active).length}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/dashboard/clientes/nuevo?routeId=${rutaId}`}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl active:bg-purple-100 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700">Nuevo Cliente</span>
            </Link>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl active:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-700">Editar Ruta</span>
            </button>
          </div>
        </div>

        {/* Clientes List */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Clientes de la Ruta</h3>
            <span className="text-sm text-gray-500">{clientes.length} total</span>
          </div>
          
          {clientes.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Sin clientes en esta ruta</p>
              <Link
                href={`/dashboard/clientes/nuevo?routeId=${rutaId}`}
                className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg active:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Cliente
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <Link
                  key={cliente.id}
                  href={`/dashboard/clientes/${cliente.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {cliente.fullName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cliente.fullName}</p>
                      <p className="text-xs text-gray-500">CC: {cliente.idNumber}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full py-4 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 touch-manipulation"
        >
          <Trash2 className="w-5 h-5" />
          <span>Eliminar Ruta</span>
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Ruta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Activa</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${formData.active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl active:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-3 bg-purple-600 text-white font-medium rounded-xl active:bg-purple-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
