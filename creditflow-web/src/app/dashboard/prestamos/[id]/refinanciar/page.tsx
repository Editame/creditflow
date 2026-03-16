'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, DollarSign, RefreshCw } from 'lucide-react';

export default function RefinanciarPrestamoPage() {
  const router = useRouter();
  const params = useParams();
  const prestamoId = parseInt(params.id as string);

  const [prestamo, setPrestamo] = useState<any>(null);
  const [selectedConceptos] = useState<{conceptoId: number; porcentaje?: number | string; montoFijo?: number | string}[]>([]);
  const [selectedCostos] = useState<{conceptoId: number; porcentaje?: number | string; montoFijo?: number | string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    montoNuevo: '',
    numeroPeriodos: '30',
    frecuenciaPago: 'DIARIO' as 'DIARIO' | 'SEMANAL',
    motivoRefinanciamiento: '',
    fechaDesembolso: new Date().toISOString().split('T')[0],
    fechaInicioCobro: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    valorCuota: '',
    fechaFin: '',
  });

  // const toggleConcepto = (conceptoId: number, porcentaje: number, esCalculado: boolean = true) => {
  //   setSelectedConceptos(prev => {
  //     const exists = prev.find(c => c.conceptoId === conceptoId);
  //     if (exists) {
  //       return prev.filter(c => c.conceptoId !== conceptoId);
  //     } else {
  //       return [...prev, esCalculado ? { conceptoId, porcentaje } : { conceptoId, montoFijo: 0 }];
  //     }
  //   });
  // };

  // const toggleCosto = (conceptoId: number, porcentaje: number, esCalculado: boolean = true) => {
  //   setSelectedCostos(prev => {
  //     const exists = prev.find(c => c.conceptoId === conceptoId);
  //     if (exists) {
  //       return prev.filter(c => c.conceptoId !== conceptoId);
  //     } else {
  //       return [...prev, esCalculado ? { conceptoId, porcentaje } : { conceptoId, montoFijo: 0 }];
  //     }
  //   });
  // };

  // const updateConceptoValue = (conceptoId: number, value: number | string, isMontoFijo: boolean) => {
  //   setSelectedConceptos(prev => 
  //     prev.map(c => 
  //       c.conceptoId === conceptoId 
  //         ? (isMontoFijo ? { conceptoId, montoFijo: value } : { conceptoId, porcentaje: value })
  //         : c
  //     )
  //   );
  // };

  // const updateCostoValue = (conceptoId: number, value: number | string, isMontoFijo: boolean) => {
  //   setSelectedCostos(prev => 
  //     prev.map(c => 
  //       c.conceptoId === conceptoId 
  //         ? (isMontoFijo ? { conceptoId, montoFijo: value } : { conceptoId, porcentaje: value })
  //         : c
  //     )
  //   );
  // };

  const calculateTotalDescuentos = () => {
    const monto = parseFloat(formData.montoNuevo) || 0;
    return selectedConceptos.reduce((total, selected) => {
      if (selected.montoFijo !== undefined && selected.montoFijo !== null) {
        const montoFijo = typeof selected.montoFijo === 'string' 
          ? parseFloat(selected.montoFijo) || 0 
          : selected.montoFijo;
        return total + montoFijo;
      } else {
        const porcentaje = typeof selected.porcentaje === 'string' 
          ? parseFloat(selected.porcentaje) || 0 
          : selected.porcentaje || 0;
        return total + (monto * (porcentaje / 100));
      }
    }, 0);
  };

  const calculateTotalCostos = () => {
    const monto = parseFloat(formData.montoNuevo) || 0;
    return selectedCostos.reduce((total, selected) => {
      if (selected.montoFijo !== undefined && selected.montoFijo !== null) {
        const montoFijo = typeof selected.montoFijo === 'string' 
          ? parseFloat(selected.montoFijo) || 0 
          : selected.montoFijo;
        return total + montoFijo;
      } else {
        const porcentaje = typeof selected.porcentaje === 'string' 
          ? parseFloat(selected.porcentaje) || 0 
          : selected.porcentaje || 0;
        return total + (monto * (porcentaje / 100));
      }
    }, 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prestamoRes = await api.loans.getOne(prestamoId);
        const prestamoData = prestamoRes;
        setPrestamo(prestamoData);
        
        setFormData(prev => ({
          ...prev,
          numeroPeriodos: '30',
          frecuenciaPago: (prestamoData as any).paymentFrequency || 'DIARIO',
        }));
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [prestamoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const conceptosDescuento = selectedConceptos.length > 0 ? selectedConceptos.map((c) => {
        if (c.montoFijo !== undefined && c.montoFijo !== null) {
          return {
            conceptId: c.conceptoId,
            fixedAmount: typeof c.montoFijo === 'string' ? parseFloat(c.montoFijo) || 0 : c.montoFijo,
          };
        } else {
          return {
            conceptId: c.conceptoId,
            percentage: typeof c.porcentaje === 'string' ? parseFloat(c.porcentaje) || 0 : c.porcentaje || 0,
          };
        }
      }) : [];

      const conceptosCosto = selectedCostos.length > 0 ? selectedCostos.map((c) => {
        if (c.montoFijo !== undefined && c.montoFijo !== null) {
          return {
            conceptId: c.conceptoId,
            fixedAmount: typeof c.montoFijo === 'string' ? parseFloat(c.montoFijo) || 0 : c.montoFijo,
          };
        } else {
          return {
            conceptId: c.conceptoId,
            percentage: typeof c.porcentaje === 'string' ? parseFloat(c.porcentaje) || 0 : c.porcentaje || 0,
          };
        }
      }) : [];

      // TODO: Implement refinanciar endpoint in backend
      await api.loans.refinance(prestamoId, {
        newAmount: parseFloat(formData.montoNuevo),
        interestRate: calculateTasaInteres(),
        paymentFrequency: formData.frecuenciaPago === 'DIARIO' ? 'DAILY' : 'WEEKLY',
        discountConcepts: conceptosDescuento.length > 0 ? conceptosDescuento : undefined,
        costConcepts: conceptosCosto.length > 0 ? conceptosCosto : undefined,
        refinancingReason: formData.motivoRefinanciamiento || undefined,
        disbursementDate: formData.fechaDesembolso,
        collectionStartDate: formData.fechaInicioCobro,
        installmentValue: parseFloat(formData.valorCuota),
        endDate: formData.fechaFin,
      });
      
      router.push('/dashboard/prestamos');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al refinanciar préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTasaInteres = () => {
    const monto = parseFloat(formData.montoNuevo) || 0;
    const cuota = parseFloat(formData.valorCuota) || 0;
    const periodos = parseInt(formData.numeroPeriodos) || 0;
    
    if (monto <= 0 || periodos <= 0) return 0;
    
    const totalAPagar = cuota * periodos;
    const intereses = totalAPagar - monto;
    const tasaInteres = (intereses / monto) * 100;
    
    return Math.max(0, tasaInteres);
  };

  useEffect(() => {
    if (formData.fechaInicioCobro && formData.numeroPeriodos) {
      const inicio = new Date(formData.fechaInicioCobro);
      const periodos = parseInt(formData.numeroPeriodos) || 30;
      const fin = new Date(inicio);
      
      if (formData.frecuenciaPago === 'DIARIO') {
        fin.setDate(fin.getDate() + periodos);
      } else {
        fin.setDate(fin.getDate() + (periodos * 7));
      }
      
      setFormData(prev => ({ ...prev, fechaFin: fin.toISOString().split('T')[0] }));
    }
  }, [formData.numeroPeriodos, formData.fechaInicioCobro, formData.frecuenciaPago]);

  const saldoPendiente = prestamo ? Number(prestamo.saldoPendiente) : 0;
  const montoNuevo = parseFloat(formData.montoNuevo) || 0;
  const valorCuota = parseFloat(formData.valorCuota) || 0;
  const numeroPeriodos = parseInt(formData.numeroPeriodos) || 0;
  
  const totalDescuentos = calculateTotalDescuentos();
  const totalCostos = calculateTotalCostos();
  const montoRecibido = montoNuevo - totalDescuentos;
  const montoEntregado = montoRecibido - saldoPendiente;
  const montoTotal = valorCuota * numeroPeriodos;
  const tasaInteres = calculateTasaInteres();
  const intereses = montoNuevo * (tasaInteres / 100);
  const gananciaReal = intereses - totalCostos;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-4 pt-4 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Refinanciar Préstamo</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 -mt-14 space-y-4 pb-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Préstamo Actual</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{prestamo?.cliente?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Saldo Pendiente:</span>
              <span className="font-bold text-orange-600">${saldoPendiente.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Monto Nuevo del Préstamo
          </label>
          <input
            type="number"
            value={formData.montoNuevo}
            onChange={(e) => setFormData({ ...formData, montoNuevo: e.target.value })}
            placeholder="0"
            required
            min={saldoPendiente + 1}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xl font-semibold"
          />
          <p className="text-xs text-gray-500 mt-2">
            Debe ser mayor a ${saldoPendiente.toLocaleString()}
          </p>
        </div>

        {montoNuevo > saldoPendiente && formData.valorCuota && formData.numeroPeriodos && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-semibold text-purple-900 mb-3">Resumen de Refinanciamiento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Monto nuevo:</span>
                <span className="font-semibold text-purple-900">${montoNuevo.toLocaleString()}</span>
              </div>
              
              {totalDescuentos > 0 && (
                <div className="flex justify-between">
                  <span className="text-orange-600">- Descuentos:</span>
                  <span className="font-semibold text-orange-600">-${totalDescuentos.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-orange-600">- Saldo anterior:</span>
                <span className="font-semibold text-orange-600">-${saldoPendiente.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between bg-green-50 p-2 rounded-lg">
                <span className="text-green-700 font-medium">= Cliente recibe:</span>
                <span className="font-bold text-green-700">${montoEntregado.toLocaleString()}</span>
              </div>
              
              <div className="border-t-2 border-purple-300 pt-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-600">Cuota: ${valorCuota.toLocaleString()} × {numeroPeriodos} {formData.frecuenciaPago === 'DIARIO' ? 'días' : 'semanas'}</span>
                  <span className="text-purple-600">Tasa: {tasaInteres.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-purple-700">Interés:</span>
                  <span className="font-semibold text-purple-900">+${intereses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-purple-200 p-2 rounded-lg mt-2">
                  <span className="text-purple-900 font-bold">Total a pagar:</span>
                  <span className="font-bold text-purple-900">${montoTotal.toLocaleString()}</span>
                </div>
              </div>
              
              {totalCostos > 0 && (
                <div className="flex justify-between pt-2">
                  <span className="text-indigo-600">+ Costos Asociados:</span>
                  <span className="font-semibold text-indigo-600">+${totalCostos.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <span className="text-emerald-700 font-medium">= Ganancia Real:</span>
                <span className={`font-bold ${
                  gananciaReal >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  ${gananciaReal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Configuración del Préstamo</label>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Frecuencia de Pago</label>
              <select
                value={formData.frecuenciaPago}
                onChange={(e) => setFormData({ ...formData, frecuenciaPago: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <option value="DIARIO">Diario</option>
                <option value="SEMANAL">Semanal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Número de {formData.frecuenciaPago === 'DIARIO' ? 'Días' : 'Semanas'}
              </label>
              <input
                type="number"
                value={formData.numeroPeriodos}
                onChange={(e) => setFormData({ ...formData, numeroPeriodos: e.target.value })}
                placeholder="30"
                required
                min="1"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor de la Cuota</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input
                  type="number"
                  value={formData.valorCuota}
                  onChange={(e) => setFormData({ ...formData, valorCuota: e.target.value })}
                  placeholder="5000"
                  required
                  min="1"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-semibold"
                />
              </div>
            </div>
          </div>
          
          {formData.montoNuevo && formData.valorCuota && formData.numeroPeriodos && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-700">Total a cobrar:</span>
                <span className="font-bold text-purple-900">
                  ${montoTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-purple-600">Tasa de interés:</span>
                <span className="font-semibold text-purple-600">
                  {tasaInteres.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-2">Fechas del Nuevo Préstamo</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Desembolso</label>
            <input
              type="date"
              value={formData.fechaDesembolso}
              onChange={(e) => {
                const desembolso = e.target.value;
                const inicioCobro = new Date(new Date(desembolso).getTime() + 86400000).toISOString().split('T')[0];
                setFormData({ ...formData, fechaDesembolso: desembolso, fechaInicioCobro: inicioCobro });
              }}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio Cobro</label>
            <input
              type="date"
              value={formData.fechaInicioCobro}
              onChange={(e) => setFormData({ ...formData, fechaInicioCobro: e.target.value })}
              required
              className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl"
            />
            <p className="text-xs text-purple-600 mt-1">Por defecto: desembolso + 1 día</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin (calculada)</label>
            <input
              type="date"
              value={formData.fechaFin}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Calculada automáticamente según el número de períodos</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
          <textarea
            value={formData.motivoRefinanciamiento}
            onChange={(e) => setFormData({ ...formData, motivoRefinanciamiento: e.target.value })}
            placeholder="Ej: Cliente necesita más capital..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || montoNuevo <= saldoPendiente}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Refinanciando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Refinanciar Préstamo</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
