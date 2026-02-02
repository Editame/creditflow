'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientesApi, prestamosApi, conceptosCobroApi, Cliente, ConceptoCobro } from '@/lib/api';
import { getTodayString } from '@/lib/timezone';
import {
  ArrowLeft,
  User,
  DollarSign,
  Percent,
  Calendar,
  CheckCircle,
  Search,
  Calculator,
  FileText,
  TrendingDown,
  Info
} from 'lucide-react';
import { DateInput } from '@/components/ui/DateInput';

export default function NuevoPrestamoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteIdParam = searchParams.get('clienteId');
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoCobro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedConceptos, setSelectedConceptos] = useState<{conceptoId: number; porcentaje: number | string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'cliente' | 'form'>(clienteIdParam ? 'form' : 'cliente');
  
  const getDefaultFechaFin = (fechaInicio: string) => {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toISOString().split('T')[0];
  };

  const today = getTodayString();

  const [formData, setFormData] = useState({
    montoPrestado: '',
    tasaInteres: '',
    frecuenciaPago: 'DIARIO',
    valorCuota: '',
    fechaInicio: today,
    fechaFin: getDefaultFechaFin(today),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const conceptosRes = await conceptosCobroApi.getAll();
        const conceptosData = conceptosRes.data?.data || [];
        setConceptos(Array.isArray(conceptosData) ? conceptosData : []);

        if (clienteIdParam) {
          const clienteRes = await clientesApi.getOne(parseInt(clienteIdParam));
          const clienteData = clienteRes.data?.data || clienteRes.data;
          if (clienteData) {
            setSelectedCliente(clienteData);
            setStep('form');
          }
        }
        
        const res = await clientesApi.getAll({ limit: 100 });
        const data = res.data?.data?.data || res.data?.data || res.data;
        setClientes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [clienteIdParam]);

  const filteredClientes = clientes.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idNumber.includes(searchQuery)
  );

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setStep('form');
  };

  const calculateTotalDescuentos = () => {
    const monto = parseFloat(formData.montoPrestado) || 0;
    return selectedConceptos.reduce((total, selected) => {
      const concepto = conceptos.find(c => c.id === selected.conceptoId);
      const porcentaje = typeof selected.porcentaje === 'string' 
        ? parseFloat(selected.porcentaje) || 0 
        : selected.porcentaje;
      return total + (monto * (porcentaje / 100));
    }, 0);
  };

  const calculateMontoRecibido = () => {
    const monto = parseFloat(formData.montoPrestado) || 0;
    return monto - calculateTotalDescuentos();
  };

  const calculateMontoTotal = () => {
    const monto = parseFloat(formData.montoPrestado) || 0;
    const interes = parseFloat(formData.tasaInteres) || 0;
    return monto * (1 + interes / 100);
  };

  const calculateNumeroPeriodos = () => {
    if (!formData.fechaInicio || !formData.fechaFin) return 0;
    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);
    const diffTime = fin.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (formData.frecuenciaPago === 'DIARIO') {
      return Math.max(1, diffDays);
    } else {
      return Math.max(1, Math.ceil(diffDays / 7));
    }
  };

  const calculateValorCuotaFromFechas = () => {
    const montoTotal = calculateMontoTotal();
    const periodos = calculateNumeroPeriodos();
    if (periodos <= 0 || montoTotal <= 0) return 0;
    return Math.ceil(montoTotal / periodos);
  };

  const calculateNumeroCuotas = () => {
    return calculateNumeroPeriodos();
  };

  useEffect(() => {
    if (formData.montoPrestado && formData.fechaInicio && formData.fechaFin) {
      const cuotaCalculada = calculateValorCuotaFromFechas();
      if (cuotaCalculada > 0) {
        setFormData(prev => ({ ...prev, valorCuota: cuotaCalculada.toString() }));
      }
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.montoPrestado, formData.tasaInteres, formData.frecuenciaPago]);

  const toggleConcepto = (conceptoId: number, porcentaje: number) => {
    setSelectedConceptos(prev => {
      const exists = prev.find(c => c.conceptoId === conceptoId);
      if (exists) {
        return prev.filter(c => c.conceptoId !== conceptoId);
      } else {
        return [...prev, { conceptoId, porcentaje }];
      }
    });
  };

  const updateConceptoPorcentaje = (conceptoId: number, nuevoPorcentaje: number | string) => {
    setSelectedConceptos(prev => 
      prev.map(c => 
        c.conceptoId === conceptoId 
          ? { ...c, porcentaje: nuevoPorcentaje }
          : c
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return;
    
    setError('');
    setIsLoading(true);

    try {
      const monto = parseFloat(formData.montoPrestado);
      await prestamosApi.create({
        clienteId: selectedCliente.id,
        montoPrestado: monto,
        tasaInteres: parseFloat(formData.tasaInteres),
        frecuenciaPago: formData.frecuenciaPago as 'DIARIO' | 'SEMANAL',
        valorCuota: parseFloat(formData.valorCuota),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        conceptosDescuento: selectedConceptos.map(c => ({
          ...c,
          porcentaje: typeof c.porcentaje === 'string' ? parseFloat(c.porcentaje) || 0 : c.porcentaje
        })),
      });

      router.push('/dashboard/prestamos');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al crear el préstamo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => step === 'form' ? setStep('cliente') : router.push('/dashboard/prestamos')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Nuevo Préstamo</h1>
            {selectedCliente && step === 'form' && (
              <p className="text-sm text-gray-500">{selectedCliente.fullName}</p>
            )}
          </div>
        </div>
      </div>

      {step === 'cliente' && (
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="space-y-2">
            {filteredClientes.map((cliente) => (
              <button
                key={cliente.id}
                onClick={() => handleSelectCliente(cliente)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-lg">
                    {cliente.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{cliente.fullName}</p>
                  <p className="text-sm text-gray-500">CC: {cliente.idNumber}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Monto a Prestar
            </label>
            <input
              type="number"
              value={formData.montoPrestado}
              onChange={(e) => setFormData({ ...formData, montoPrestado: e.target.value })}
              placeholder="0"
              required
              min="1"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xl font-semibold placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Percent className="w-4 h-4 inline mr-2" />
              Tasa de Interés (%)
            </label>
            <input
              type="number"
              value={formData.tasaInteres}
              onChange={(e) => setFormData({ ...formData, tasaInteres: e.target.value })}
              placeholder="20"
              required
              min="0"
              max="100"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Frecuencia de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['DIARIO', 'SEMANAL'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFormData({ ...formData, frecuenciaPago: freq })}
                  className={`py-3 rounded-xl font-medium transition-colors ${
                    formData.frecuenciaPago === freq
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {freq === 'DIARIO' ? 'Diario' : 'Semanal'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                <Calculator className="w-4 h-4 inline mr-2" />
                Valor de la Cuota
              </label>
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                Auto-calculado
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                value={formData.valorCuota}
                onChange={(e) => setFormData({ ...formData, valorCuota: e.target.value })}
                placeholder="0"
                required
                min="1"
                className="w-full pl-8 pr-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-gray-900 text-lg font-semibold placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Calculado según el período y monto. Puedes ajustarlo manualmente.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Período del Préstamo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha Inicio</label>
                <DateInput
                  value={formData.fechaInicio}
                  onChange={(newFechaInicio) => {
                    const oldInicio = new Date(formData.fechaInicio);
                    const oldFin = new Date(formData.fechaFin);
                    const duracion = oldFin.getTime() - oldInicio.getTime();
                    const newFin = new Date(new Date(newFechaInicio).getTime() + duracion);
                    setFormData({
                      ...formData,
                      fechaInicio: newFechaInicio,
                      fechaFin: newFin.toISOString().split('T')[0]
                    });
                  }}
                  required
                  className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha Fin</label>
                <DateInput
                  value={formData.fechaFin}
                  min={formData.fechaInicio}
                  onChange={(value) => setFormData({ ...formData, fechaFin: value })}
                  required
                  className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {calculateNumeroPeriodos()} {formData.frecuenciaPago === 'DIARIO' ? 'días' : 'semanas'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 inline mr-2" />
                Conceptos de Cobro
              </label>
              <div className="flex items-center text-xs text-gray-500">
                <Info className="w-3 h-3 mr-1" />
                Ajustables por cliente
              </div>
            </div>
            
            {conceptos.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No hay conceptos de cobro disponibles</p>
                <p className="text-xs text-gray-400 mt-1">
                  Los administradores pueden crear conceptos desde la sección de configuración
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conceptos.map((concepto) => {
                  const selectedConcepto = selectedConceptos.find(c => c.conceptoId === concepto.id);
                  const isSelected = !!selectedConcepto;
                  const currentPorcentaje = selectedConcepto ? selectedConcepto.porcentaje : concepto.porcentaje;
                  const percentageValue = typeof currentPorcentaje === 'string' 
                    ? parseFloat(currentPorcentaje) || 0 
                    : currentPorcentaje;
                  const montoDescuento = formData.montoPrestado ? 
                    (parseFloat(formData.montoPrestado) * (percentageValue / 100)) : 0;
                  
                  return (
                    <div
                      key={concepto.id}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => toggleConcepto(concepto.id, concepto.porcentaje)}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{concepto.name}</p>
                            <p className="text-xs text-gray-500">{concepto.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentPorcentaje}
                              onChange={(e) => updateConceptoPorcentaje(concepto.id, e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-16 px-2 py-1 text-center bg-white border border-purple-200 rounded-lg text-sm font-semibold text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-100"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm font-semibold text-purple-600">%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            Base: {concepto.porcentaje}%
                          </span>
                          {isSelected && percentageValue !== concepto.porcentaje && (
                            <span className="text-orange-600 font-medium">
                              → {currentPorcentaje}%
                            </span>
                          )}
                        </div>
                        {formData.montoPrestado && (
                          <span className="text-gray-600 font-medium">
                            ${montoDescuento.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {selectedConceptos.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                        Total Descuentos:
                      </span>
                      <span className="font-bold text-orange-600">
                        ${calculateTotalDescuentos().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {formData.montoPrestado && formData.valorCuota && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <h3 className="font-semibold text-purple-900 mb-3">Resumen del Préstamo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Monto prestado:</span>
                  <span className="font-semibold text-purple-900">
                    ${parseFloat(formData.montoPrestado).toLocaleString()}
                  </span>
                </div>
                
                {selectedConceptos.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Descuentos:</span>
                      <span className="font-semibold text-orange-600">
                        -${calculateTotalDescuentos().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between bg-green-50 p-2 rounded-lg">
                      <span className="text-green-700 font-medium">Monto a recibir:</span>
                      <span className="font-bold text-green-700">
                        ${calculateMontoRecibido().toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-purple-700">Interés ({formData.tasaInteres}%):</span>
                  <span className="font-semibold text-purple-900">
                    ${(calculateMontoTotal() - parseFloat(formData.montoPrestado)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-purple-200 pt-2">
                  <span className="text-purple-700">Total a pagar:</span>
                  <span className="font-bold text-purple-900">
                    ${calculateMontoTotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Número de cuotas:</span>
                  <span className="font-semibold text-purple-900">
                    {calculateNumeroCuotas()} {formData.frecuenciaPago === 'DIARIO' ? 'días' : 'semanas'}
                  </span>
                </div>
                
                {selectedConceptos.length > 0 && (
                  <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                    <p className="text-xs text-purple-700 text-center">
                      <Calculator className="w-3 h-3 inline mr-1" />
                      Los intereses se calculan sobre el monto original (${parseFloat(formData.montoPrestado).toLocaleString()})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creando...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                <span>Crear Préstamo</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
