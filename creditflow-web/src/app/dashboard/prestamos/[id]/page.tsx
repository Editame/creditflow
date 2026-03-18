'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { loansApi } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { formatTimeInTimezone, formatDateShort, formatBusinessDate } from '@/lib/timezone';
import {
  ArrowLeft,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function PrestamoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const prestamoId = parseInt(params.id as string);
  const { success, error: showError } = useToast();
  
  const [prestamo, setPrestamo] = useState<any | null>(null);
  const [pagos, setPagos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await loansApi.getOne(prestamoId);
        const prestamoData = res as any;
        setPrestamo(prestamoData);
        
        if ((prestamoData as any)?.payments) {
          setPagos((prestamoData as any).payments);
        }
      } catch (error) {
        console.error('Error fetching prestamo:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (prestamoId) fetchData();
  }, [prestamoId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-5 h-5 text-purple-600" />;
      case 'OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-purple-500';
      case 'OVERDUE':
        return 'bg-red-500';
      case 'PAID':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'OVERDUE': return 'En Mora';
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

  if (!prestamo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Préstamo no encontrado</p>
        </div>
      </div>
    );
  }

  const montoPrestado = Number(prestamo.loanAmount) || 0;
  const tasaInteres = Number(prestamo.interestRate) || 0;
  const montoTotal = montoPrestado * (1 + tasaInteres / 100);
  const saldoPendiente = Number(prestamo.pendingBalance) || 0;
  const montoPagado = montoTotal - saldoPendiente;
  const progreso = montoTotal > 0 ? (montoPagado / montoTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${getStatusStyle(prestamo.status)} px-4 pt-4 pb-20`}>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/prestamos')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Detalle del Préstamo</h1>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            {getStatusIcon(prestamo.status)}
          </div>
          <div>
            <p className="text-white/80 text-sm">Estado</p>
            <p className="text-xl font-bold text-white">{getStatusLabel(prestamo.status)}</p>
          </div>
        </div>

        {prestamo.client && (
          <Link 
            href={`/dashboard/clientes/${prestamo.client.id}`}
            className="flex items-center gap-2 text-white/90 active:text-white"
          >
            <User className="w-4 h-4" />
            <span>{prestamo.client.fullName}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="px-4 -mt-14 space-y-4 pb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Progreso de Pago</h2>
            <span className="text-sm font-medium text-purple-600">
              {progreso.toFixed(0)}%
            </span>
          </div>
          
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                prestamo.status === 'PAID' ? 'bg-green-500' : 
                prestamo.status === 'OVERDUE' ? 'bg-red-500' : 'bg-purple-500'
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Pagado</p>
              <p className="text-lg font-bold text-green-600">
                ${montoPagado.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Pendiente</p>
              <p className="text-lg font-bold text-gray-900">
                ${saldoPendiente.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Detalles del Préstamo</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Monto Prestado</span>
              <span className="font-semibold text-gray-900">
                ${Number(prestamo.loanAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Tasa de Interés</span>
              <span className="font-semibold text-gray-900">
                {Number(prestamo.interestRate)}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Total a Pagar</span>
              <span className="font-semibold text-gray-900">
                ${montoTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Valor Cuota</span>
              <span className="font-semibold text-purple-600">
                ${Number(prestamo.installmentValue).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Frecuencia</span>
              <span className="font-semibold text-gray-900">
                {prestamo.paymentFrequency === 'DAILY' ? 'Diario' : prestamo.paymentFrequency === 'WEEKLY' ? 'Semanal' : prestamo.paymentFrequency === 'BIWEEKLY' ? 'Quincenal' : 'Mensual'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Fecha Inicio</span>
              <span className="font-semibold text-gray-900">
                {formatBusinessDate(prestamo.disbursementDate)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Fecha Fin</span>
              <span className="font-semibold text-gray-900">
                {formatBusinessDate(prestamo.endDate)}
              </span>
            </div>
          </div>
        </div>

        {prestamo.discounts && prestamo.discounts.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Conceptos de Cobro</h3>
            <div className="space-y-2">
              {prestamo.discounts.map((descuento: any) => (
                <div key={descuento.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {descuento.concept?.name || 'Concepto'}
                    </span>
                    {descuento.concept?.description && (
                      <span className="text-xs text-gray-500">
                        {descuento.concept.description}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-purple-600">
                      {Number(descuento.percentage)}%
                    </span>
                    <p className="text-xs text-gray-500">
                      ${Number(descuento.discountAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Descuentos</span>
                  <span className="text-sm font-bold text-orange-600">
                    -${Number(prestamo.totalDiscounts || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Monto Recibido</span>
                  <span className="text-sm font-bold text-green-800">
                    ${Number(prestamo.receivedAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {prestamo.status !== 'PAID' && (
          <Link
            href={`/dashboard/cobrar?clienteId=${prestamo.clientId}&prestamoId=${prestamo.id}`}
            className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 transition-all"
          >
            <DollarSign className="w-5 h-5" />
            <span>Registrar Pago</span>
          </Link>
        )}

        {pagos.length === 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-3 w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-200 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            <span>Eliminar Préstamo</span>
          </button>
        )}

        {/* Modal confirmación eliminar */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Eliminar Préstamo</h3>
                <button onClick={() => setShowDeleteConfirm(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <p className="text-sm text-red-700">
                  ¿Estás seguro de eliminar este préstamo? Esta acción no se puede deshacer y se revertirá el movimiento de caja asociado.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await loansApi.delete(prestamoId);
                      success('Préstamo eliminado', 'El préstamo ha sido eliminado correctamente');
                      router.push('/dashboard/prestamos');
                    } catch (err: any) {
                      showError('Error', err.response?.data?.message || 'Error al eliminar el préstamo');
                      setShowDeleteConfirm(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Historial de Pagos</h3>
            <span className="text-sm text-gray-500">{pagos.length} pagos</span>
          </div>
          
          {pagos.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Sin pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pagos.slice(0, 10).map((pago) => (
                <div
                  key={pago.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        ${Number(pago.amountPaid).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pago.notes || 'Pago'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatDateShort(pago.paymentDate)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTimeInTimezone(pago.paymentDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
