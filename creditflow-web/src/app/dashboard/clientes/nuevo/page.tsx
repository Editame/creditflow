'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, User, CreditCard, MapPin, Phone, Home } from 'lucide-react';

export default function NuevoClientePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rutas, setRutas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    routeId: searchParams.get('routeId') || '',
    idNumber: '',
    fullName: '',
    phone: '',
    address: '',
  });

  const [idNumberError, setIdNumberError] = useState('');

  const validateIdNumber = (idNumber: string) => {
    if (!idNumber) {
      setIdNumberError('');
      return;
    }
    
    if (!/^[0-9]+$/.test(idNumber)) {
      setIdNumberError('La cédula debe contener solo números');
    } else {
      setIdNumberError('');
    }
  };

  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await api.routes.getAll();
        const data = res;
        setRutas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching rutas:', error);
      }
    };
    fetchRutas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    validateIdNumber(formData.idNumber);
    if (idNumberError) {
      return;
    }

    setIsLoading(true);

    try {
      await api.clients.create({
        routeId: parseInt(formData.routeId),
        idNumber: formData.idNumber,
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
      router.push('/dashboard/clientes');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al crear el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Nuevo Cliente</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Ruta Select */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Ruta
          </label>
          <select
            value={formData.routeId}
            onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all touch-manipulation"
          >
            <option value="">Seleccionar ruta...</option>
            {rutas.map((ruta) => (
              <option key={ruta.id} value={ruta.id}>
                {ruta.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cédula */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 inline mr-2" />
            Cédula
          </label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, idNumber: value });
              validateIdNumber(value);
            }}
            placeholder="Número de cédula"
            required
            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 transition-all touch-manipulation ${
              idNumberError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
            }`}
          />
          {idNumberError && (
            <p className="text-red-600 text-xs mt-1">{idNumberError}</p>
          )}
        </div>

        {/* Nombre Completo */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nombre Completo
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Nombre y apellidos"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all touch-manipulation"
          />
        </div>

        {/* Teléfono */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Número de teléfono"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all touch-manipulation"
          />
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Home className="w-4 h-4 inline mr-2" />
            Dirección
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Dirección completa"
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-none touch-manipulation"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6 touch-manipulation"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span>Crear Cliente</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
