'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeft,
  Wallet,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ChevronRight,
  X,
  Tag,
} from 'lucide-react';

interface CashRegister {
  id: number;
  name: string;
  balance: number;
  routeId: number | null;
  route?: { name: string } | null;
  today?: { in: number; out: number; net: number; movements: number };
}

interface CashConcept {
  id: number;
  name: string;
  type: 'IN' | 'OUT';
  isSystem: boolean;
  description?: string;
}

interface CashMovement {
  id: number;
  type: 'IN' | 'OUT';
  amount: number;
  balanceAfter: number;
  description?: string;
  date: string;
  concept: { name: string };
  cashRegister: { name: string };
}

export default function CapitalPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [concepts, setConcepts] = useState<CashConcept[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showNewRegister, setShowNewRegister] = useState(false);
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showNewConcept, setShowNewConcept] = useState(false);

  // Forms
  const [registerForm, setRegisterForm] = useState({ name: '', routeId: '' });
  const [movementForm, setMovementForm] = useState({ conceptId: '', amount: '', description: '' });
  const [conceptForm, setConceptForm] = useState({ name: '', type: 'IN' as 'IN' | 'OUT', description: '' });

  const [routes, setRoutes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [regs, concs, rts] = await Promise.all([
        api.cash.getRegisters(),
        api.cash.getConcepts(),
        api.routes.getAll(),
      ]);
      setRegisters(Array.isArray(regs) ? regs : []);
      setConcepts(Array.isArray(concs) ? concs : []);
      setRoutes(Array.isArray(rts) ? rts : []);

      // Load summary for each register
      const summaries = await Promise.all(
        (Array.isArray(regs) ? regs : []).map((r: any) => api.cash.getRegisterSummary(r.id).catch(() => r))
      );
      setRegisters(summaries);

      // Auto-select first register
      if (summaries.length > 0) {
        setSelectedRegister(summaries[0]);
        await loadMovements(summaries[0].id);
      }
    } catch (e) {
      console.error('Error loading cash data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMovements = async (registerId: number) => {
    try {
      const movs = await api.cash.getMovements({ cashRegisterId: registerId, limit: 50 });
      setMovements(Array.isArray(movs) ? movs : []);
    } catch (e) {
      console.error('Error loading movements:', e);
    }
  };

  const selectRegister = async (reg: CashRegister) => {
    setSelectedRegister(reg);
    await loadMovements(reg.id);
  };

  const handleCreateRegister = async () => {
    if (!registerForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.cash.createRegister({
        name: registerForm.name,
        routeId: registerForm.routeId ? parseInt(registerForm.routeId) : undefined,
      });
      success('Caja creada', `${registerForm.name} ha sido creada exitosamente`);
      setShowNewRegister(false);
      setRegisterForm({ name: '', routeId: '' });
      await loadData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al crear la caja');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMovement = async () => {
    if (!movementForm.conceptId || !movementForm.amount || !selectedRegister) return;
    setIsSubmitting(true);
    try {
      await api.cash.createMovement({
        cashRegisterId: selectedRegister.id,
        conceptId: parseInt(movementForm.conceptId),
        amount: parseFloat(movementForm.amount),
        description: movementForm.description || undefined,
      });
      success('Movimiento registrado', 'El movimiento se ha registrado correctamente');
      setShowNewMovement(false);
      setMovementForm({ conceptId: '', amount: '', description: '' });
      await loadData();
      if (selectedRegister) await loadMovements(selectedRegister.id);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConcept = async () => {
    if (!conceptForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.cash.createConcept(conceptForm);
      success('Concepto creado', `${conceptForm.name} ha sido creado`);
      setShowNewConcept(false);
      setConceptForm({ name: '', type: 'IN', description: '' });
      const concs = await api.cash.getConcepts();
      setConcepts(Array.isArray(concs) ? concs : []);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'Error al crear concepto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const manualConcepts = concepts.filter(c => !c.isSystem);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/gestion')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Capital / Caja</h1>
              <p className="text-sm text-gray-500">Gestión de capital y movimientos</p>
            </div>
          </div>
          <button onClick={() => setShowNewRegister(true)} className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* No registers */}
        {registers.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No tienes cajas creadas</h3>
            <p className="text-sm text-gray-500 mb-4">Crea tu primera caja para empezar a controlar tu capital</p>
            <button onClick={() => setShowNewRegister(true)} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium">
              <Plus className="w-4 h-4 inline mr-2" />Crear Caja
            </button>
          </div>
        )}

        {/* Register cards */}
        {registers.length > 0 && (
          <div className="space-y-3">
            {registers.map((reg) => (
              <button
                key={reg.id}
                onClick={() => selectRegister(reg)}
                className={`w-full text-left p-4 rounded-2xl shadow-sm transition-all ${
                  selectedRegister?.id === reg.id ? 'bg-purple-50 border-2 border-purple-300' : 'bg-white border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reg.routeId ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <Wallet className={`w-5 h-5 ${reg.routeId ? 'text-blue-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{reg.name}</p>
                      <p className="text-xs text-gray-500">{reg.routeId ? `Ruta: ${reg.route?.name}` : 'Caja Global'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Saldo actual</p>
                    <p className={`text-2xl font-bold ${Number(reg.balance) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      ${Number(reg.balance).toLocaleString()}
                    </p>
                  </div>
                  {reg.today && (
                    <div className="flex gap-4 text-xs">
                      <div className="text-center">
                        <p className="text-green-600 font-semibold">${reg.today.in.toLocaleString()}</p>
                        <p className="text-gray-400">Entradas hoy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-red-600 font-semibold">${reg.today.out.toLocaleString()}</p>
                        <p className="text-gray-400">Salidas hoy</p>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected register detail */}
        {selectedRegister && (
          <>
            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowNewMovement(true)}
                className="p-4 bg-white rounded-2xl shadow-sm flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900 text-sm">Registrar Movimiento</span>
              </button>
              <button
                onClick={() => setShowNewConcept(true)}
                className="p-4 bg-white rounded-2xl shadow-sm flex items-center gap-3 active:bg-gray-50"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900 text-sm">Nuevo Concepto</span>
              </button>
            </div>

            {/* Movements list */}
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Últimos Movimientos
                </h3>
              </div>
              {movements.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No hay movimientos aún</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {movements.map((mov) => (
                    <div key={mov.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          mov.type === 'IN' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {mov.type === 'IN'
                            ? <ArrowDownCircle className="w-4 h-4 text-green-600" />
                            : <ArrowUpCircle className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{mov.concept?.name}</p>
                          <p className="text-xs text-gray-500">
                            {mov.description && `${mov.description} · `}
                            {new Date(mov.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${mov.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.type === 'IN' ? '+' : '-'}${Number(mov.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Saldo: ${Number(mov.balanceAfter).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal: New Register */}
      {showNewRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Nueva Caja</h3>
              <button onClick={() => setShowNewRegister(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                placeholder="Ej: Caja Principal"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={registerForm.routeId}
                onChange={(e) => setRegisterForm({ ...registerForm, routeId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                <option value="">Caja Global</option>
                {routes.map((r: any) => (
                  <option key={r.id} value={r.id}>Ruta: {r.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateRegister}
              disabled={isSubmitting || !registerForm.name.trim()}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Caja'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: New Movement */}
      {showNewMovement && selectedRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Registrar Movimiento</h3>
              <button onClick={() => setShowNewMovement(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500">Caja: {selectedRegister.name}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
              <select
                value={movementForm.conceptId}
                onChange={(e) => setMovementForm({ ...movementForm, conceptId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                <option value="">Seleccionar concepto...</option>
                {manualConcepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'IN' ? '↑' : '↓'} {c.name}
                  </option>
                ))}
              </select>
              {manualConcepts.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">No hay conceptos manuales. Crea uno primero.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <input
                type="number"
                value={movementForm.amount}
                onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                placeholder="0"
                min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xl font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={movementForm.description}
                onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                placeholder="Ej: Inyección de capital enero"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <button
              onClick={handleCreateMovement}
              disabled={isSubmitting || !movementForm.conceptId || !movementForm.amount}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: New Concept */}
      {showNewConcept && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Nuevo Concepto</h3>
              <button onClick={() => setShowNewConcept(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={conceptForm.name}
                onChange={(e) => setConceptForm({ ...conceptForm, name: e.target.value })}
                placeholder="Ej: Inyección de capital, Retiro del dueño..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConceptForm({ ...conceptForm, type: 'IN' })}
                  className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                    conceptForm.type === 'IN' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setConceptForm({ ...conceptForm, type: 'OUT' })}
                  className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                    conceptForm.type === 'OUT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" /> Egreso
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={conceptForm.description}
                onChange={(e) => setConceptForm({ ...conceptForm, description: e.target.value })}
                placeholder="Descripción del concepto"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <button
              onClick={handleCreateConcept}
              disabled={isSubmitting || !conceptForm.name.trim()}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Concepto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
