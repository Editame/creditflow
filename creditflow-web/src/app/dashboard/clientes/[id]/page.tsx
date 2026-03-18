'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { clientsApi, loansApi } from '@/lib/api';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Phone,
  DollarSign,
  Plus,
  Edit,
  ChevronRight,
  Trash2,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Ban,
  Unlock,
  History,
  Camera
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import VisualIdentifier from '@/components/VisualIdentifier';

export default function ClienteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const clienteId = parseInt(params.id as string);
  
  const [cliente, setCliente] = useState<any>(null);
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [historial, setHistorial] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phone: '',
    address: '',
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clienteRes, prestamosRes] = await Promise.all([
          clientsApi.getOne(clienteId),
          loansApi.getAll({ limit: 50, clientId: clienteId }),
        ]);
        
        const clienteData = clienteRes;
        setCliente(clienteData);
        setFormData({
          fullName: clienteData.fullName || '',
          idNumber: clienteData.idNumber || '',
          phone: clienteData.phone || '',
          address: clienteData.address || '',
        });
        
        const prestamosData = prestamosRes;
        setPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
      } catch (error) {
        console.error('Error fetching cliente:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (clienteId) fetchData();
  }, [clienteId]);

  const handleUpdate = async () => {
    try {
      await clientsApi.update(clienteId, formData);
      const res = await clientsApi.getOne(clienteId);
      setCliente(res);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating cliente:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await clientsApi.delete(clienteId);
      router.push('/dashboard/clientes');
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };

  const handleToggleBlock = async () => {
    if (!cliente) return;
    
    try {
      setError('');
      if (cliente.blocked) {
        await clientsApi.update(cliente.id, { blocked: false, blockReason: '' } as any);
        setCliente({ ...cliente, blocked: false, blockReason: undefined });
      } else {
        if (!motivoBloqueo.trim()) {
          setError('Debe indicar el motivo del bloqueo');
          return;
        }
        await clientsApi.update(cliente.id, { blocked: true, blockReason: motivoBloqueo } as any);
        setCliente({ ...cliente, blocked: true, blockReason: motivoBloqueo });
        setShowBlockModal(false);
        setMotivoBloqueo('');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar estado del cliente');
    }
  };

  const loadHistorial = async () => {
    try {
      // TODO: Implement getHistorial method in API
      // const res = await clientesApi.getHistorial(clienteId);
      // setHistorial(res.data?.data || res.data);
      setHistorial([]);
      setShowHistorial(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-purple-100 text-purple-700';
      case 'OVERDUE':
        return 'bg-red-100 text-red-700';
      case 'PAID':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'OVERDUE': return 'En mora';
      case 'PAID': return 'Pagado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Cliente no encontrado</p>
        </div>
      </div>
    );
  }

  const totalDeuda = prestamos
    .filter(p => p.status !== 'PAID')
    .reduce((sum, p) => sum + Number(p.pendingBalance || 0), 0);

  const prestamosActivos = prestamos.filter(p => p.status === 'ACTIVE').length;

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
          <h1 className="text-lg font-semibold text-white">Detalle del Cliente</h1>
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-4">
          <VisualIdentifier 
            name={cliente.fullName}
            variant="client"
            size="xl"
            className="shadow-lg"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{cliente.fullName}</h2>
            <p className="text-purple-100 text-sm">CC: {cliente.idNumber}</p>
            {cliente.blocked && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                <Ban className="w-3 h-3" />
                Bloqueado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-14 space-y-4 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Deuda Total</p>
            <p className="text-2xl font-bold text-gray-900">${totalDeuda.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-1">Préstamos Activos</p>
            <p className="text-2xl font-bold text-gray-900">{prestamosActivos}</p>
          </div>
        </div>

        {/* Client Details */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Información</h3>
            <button
              onClick={() => setShowEditModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Cédula</p>
                <p className="font-medium text-gray-900">{cliente.idNumber}</p>
              </div>
              <button
                onClick={() => copyToClipboard(cliente.idNumber)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copiar cédula"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            {cliente.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{cliente.phone}</p>
                </div>
              </div>
            )}
            {cliente.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{cliente.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Foto de Cédula</p>
                {cliente.idPhotoUrl ? (
                  <div className="mt-1">
                    <div 
                      className="relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setExpandedImage(cliente.idPhotoUrl || null)}
                    >
                      <Image src={cliente.idPhotoUrl} alt="Foto de Cédula" fill className="object-cover" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Click para ampliar</p>
                  </div>
                ) : (
                  <p className="font-medium text-gray-500 italic text-sm">No hay foto</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Acciones</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={loadHistorial}
              className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-xl active:bg-indigo-100 transition-colors"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-indigo-700">Historial</span>
            </button>
            
            <button
              onClick={() => cliente.blocked ? handleToggleBlock() : setShowBlockModal(true)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl active:opacity-80 transition-colors ${
                cliente.blocked ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                cliente.blocked ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {cliente.blocked ? <Unlock className="w-5 h-5 text-white" /> : <Ban className="w-5 h-5 text-white" />}
              </div>
              <span className={`text-sm font-medium ${
                cliente.blocked ? 'text-green-700' : 'text-red-700'
              }`}>
                {cliente.blocked ? 'Desbloquear' : 'Bloquear'}
              </span>
            </button>

            <Link
              href={`/dashboard/cobrar?clienteId=${cliente.id}`}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl active:bg-green-100 transition-colors"
            >
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-green-700">Cobrar</span>
            </Link>
            <Link
              href={`/dashboard/prestamos/nuevo?clienteId=${cliente.id}`}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl active:bg-purple-100 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-700">Nuevo Préstamo</span>
            </Link>
          </div>
        </div>

        {/* Prestamos List */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Préstamos</h3>
            <span className="text-sm text-gray-500">{prestamos.length} total</span>
          </div>
          
          {prestamos.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Sin préstamos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {prestamos.map((prestamo) => (
                <Link
                  key={prestamo.id}
                  href={`/dashboard/prestamos/${prestamo.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(prestamo.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        ${Number(prestamo.loanAmount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Saldo: ${Number(prestamo.pendingBalance).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(prestamo.status)}`}>
                      {getStatusLabel(prestamo.status)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
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
          <span>Eliminar Cliente</span>
        </button>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute -top-12 right-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImage(null);
              }}
            >
              ✕
            </button>
            <div className="relative">
              <Image 
                src={expandedImage} 
                alt="Foto de Cédula Ampliada" 
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
            <p className="text-white/60 text-sm text-center mt-4">Click fuera o en la X para cerrar</p>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bloquear Cliente</h3>
            <p className="text-sm text-gray-600 mb-4">
              Indique el motivo por el cual se bloqueará a este cliente:
            </p>
            <textarea
              value={motivoBloqueo}
              onChange={(e) => setMotivoBloqueo(e.target.value)}
              placeholder="Ej: Mal historial de pagos, incumplimiento reiterado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
            />
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial Modal */}
      {showHistorial && historial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Historial del Cliente</h3>
                <button
                  onClick={() => setShowHistorial(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-600 mb-1">Total Préstamos</p>
                  <p className="text-2xl font-bold text-purple-900">{historial.metricas.totalPrestamos}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-600 mb-1">Pagados</p>
                  <p className="text-2xl font-bold text-green-900">{historial.metricas.prestamosPagados}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-indigo-600 mb-1">Activos</p>
                  <p className="text-2xl font-bold text-indigo-900">{historial.metricas.prestamosActivos}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-600 mb-1">Cumplimiento</p>
                  <p className="text-2xl font-bold text-orange-900">{historial.metricas.tasaCumplimiento}%</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Préstamos Históricos</h4>
                <div className="space-y-2">
                  {historial.prestamos.map((p: any) => (
                    <div key={p.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          ${Number(p.montoPrestado).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          p.estado === 'PAGADO' ? 'bg-green-100 text-green-700' :
                          p.estado === 'MORA' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {p.estado}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {p.fechaDesembolso ? new Date(p.fechaDesembolso).toLocaleDateString() : 'Fecha no disponible'} - {p.pagos?.length || 0} pagos
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Cliente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
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
