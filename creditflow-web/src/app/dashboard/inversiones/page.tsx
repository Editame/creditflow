'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  DollarSign,
  ChevronRight,
  X,
  CheckCircle,
  Banknote,
} from 'lucide-react';

interface Investment {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  interestRate: number;
  frequency: string;
  expectedReturn: number;
  status: string;
  startDate: string;
  recoveredAt: string | null;
  notes: string | null;
  returns: InvestmentReturn[];
}

interface InvestmentReturn {
  id: number;
  amount: number;
  date: string;
  notes: string | null;
}

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
};

export default function InversionesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Investment | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<Investment | null>(null);
  const [showRecoverModal, setShowRecoverModal] = useState<Investment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Investment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    amount: '',
    interestRate: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [returnForm, setReturnForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const data = await api.investments.getAll();
      setInvestments(Array.isArray(data) ? data : []);
    } catch { /* feature not enabled */ }
    finally { setLoading(false); }
  };

  const resetForm = () => setForm({
    name: '', description: '', amount: '', interestRate: '',
    frequency: 'MONTHLY', startDate: new Date().toISOString().split('T')[0], notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.investments.create({
        name: form.name,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        interestRate: parseFloat(form.interestRate),
        frequency: form.frequency,
        startDate: form.startDate,
        notes: form.notes || undefined,
      });
      success('Inversión creada', `${form.name} registrada exitosamente`);
      setShowCreate(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;
    setIsSubmitting(true);
    try {
      await api.investments.registerReturn(showReturnModal.id, {
        amount: parseFloat(returnForm.amount),
        date: returnForm.date,
        notes: returnForm.notes || undefined,
      });
      success('Rendimiento registrado', `$${parseFloat(returnForm.amount).toLocaleString()} cobrado`);
      setShowReturnModal(null);
      setReturnForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      await fetchData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleRecover = async () => {
    if (!showRecoverModal) return;
    setIsSubmitting(true);
    try {
      await api.investments.recover(showRecoverModal.id);
      success('Inversión recuperada', `Base de $${Number(showRecoverModal.amount).toLocaleString()} marcada como recuperada`);
      setShowRecoverModal(null);
      await fetchData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await api.investments.delete(showDeleteModal.id);
      success('Inversión eliminada', `${showDeleteModal.name} fue eliminada`);
      setShowDeleteModal(null);
      setShowDetail(null);
      await fetchData();
    } catch (err: any) {
      showError('Error', err.response?.data?.message || err.message);
    }
  };

  const totalInvested = investments.filter(i => i.status === 'ACTIVE').reduce((s, i) => s + Number(i.amount), 0);
  const totalReturns = investments.reduce((s, i) => s + i.returns.reduce((rs, r) => rs + Number(r.amount), 0), 0);
  const activeCount = investments.filter(i => i.status === 'ACTIVE').length;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-slate-900">Inversiones</h1>
            <p className="text-xs lg:text-sm text-slate-500">Capital invertido y rendimientos</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(true); }}
          className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 lg:p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] lg:text-xs text-slate-500">Invertido</span>
          </div>
          <p className="text-sm lg:text-lg font-bold text-slate-900">${totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-3 lg:p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] lg:text-xs text-slate-500">Cobrado</span>
          </div>
          <p className="text-sm lg:text-lg font-bold text-slate-900">${totalReturns.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-3 lg:p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] lg:text-xs text-slate-500">Activas</span>
          </div>
          <p className="text-sm lg:text-lg font-bold text-slate-900">{activeCount}</p>
        </div>
      </div>

      {/* List */}
      {investments.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-900 font-medium mb-1">Sin inversiones</p>
          <p className="text-slate-500 text-sm mb-6">Registra tu primera inversión de capital</p>
          <button onClick={() => { resetForm(); setShowCreate(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl active:scale-95 transition-transform">
            <Plus className="w-5 h-5" /> Nueva Inversión
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((inv) => {
            const totalCollected = inv.returns.reduce((s, r) => s + Number(r.amount), 0);
            const isActive = inv.status === 'ACTIVE';
            return (
              <button key={inv.id} onClick={() => setShowDetail(inv)}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-left active:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                      <TrendingUp className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{inv.name}</p>
                      <p className="text-xs text-slate-500">{FREQ_LABELS[inv.frequency]} · {inv.interestRate}%</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400">Base</p>
                      <p className="text-sm font-bold text-slate-900">${Number(inv.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Cobrado</p>
                      <p className="text-sm font-bold text-emerald-600">${totalCollected.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isActive ? 'Activa' : 'Recuperada'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Nueva Inversión</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                <X size={16} className="text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Persona</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  placeholder="Ej: Juan Pérez - Capital" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto Base</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required
                    placeholder="5000000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tasa %</label>
                  <input type="number" step="0.01" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} required
                    placeholder="10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              {form.amount && form.interestRate && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs text-emerald-700">Rendimiento esperado: <span className="font-bold">${((parseFloat(form.amount) * parseFloat(form.interestRate)) / 100).toLocaleString()}</span> por período</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <option value="DAILY">Diario</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="BIWEEKLY">Quincenal</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalles de la inversión" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{showDetail.name}</h3>
              <button onClick={() => setShowDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                <X size={16} className="text-slate-600" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500">Base Invertida</p>
                  <p className="text-lg font-bold text-slate-900">${Number(showDetail.amount).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-[10px] text-emerald-600">Rendimiento Esperado</p>
                  <p className="text-lg font-bold text-emerald-700">${Number(showDetail.expectedReturn).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tasa: <span className="font-medium text-slate-900">{showDetail.interestRate}%</span></span>
                <span className="text-slate-500">Frecuencia: <span className="font-medium text-slate-900">{FREQ_LABELS[showDetail.frequency]}</span></span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Inicio: <span className="font-medium text-slate-900">{new Date(showDetail.startDate).toLocaleDateString('es-ES')}</span></span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${showDetail.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {showDetail.status === 'ACTIVE' ? 'Activa' : 'Recuperada'}
                </span>
              </div>
              {showDetail.description && <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{showDetail.description}</p>}

              {/* Actions */}
              {showDetail.status === 'ACTIVE' && (
                <div className="flex gap-3">
                  <button onClick={() => { setReturnForm({ amount: String(showDetail.expectedReturn), date: new Date().toISOString().split('T')[0], notes: '' }); setShowReturnModal(showDetail); }}
                    className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" /> Cobrar Rendimiento
                  </button>
                  <button onClick={() => setShowRecoverModal(showDetail)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Recuperar Base
                  </button>
                </div>
              )}

              {/* Returns History */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  Rendimientos ({showDetail.returns.length})
                  {showDetail.returns.length > 0 && (
                    <span className="font-normal text-emerald-600 ml-2">
                      Total: ${showDetail.returns.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}
                    </span>
                  )}
                </h4>
                {showDetail.returns.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Sin rendimientos registrados</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {showDetail.returns.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-emerald-700">${Number(r.amount).toLocaleString()}</p>
                          {r.notes && <p className="text-[10px] text-slate-500">{r.notes}</p>}
                        </div>
                        <p className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString('es-ES')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              {showDetail.returns.length === 0 && (
                <button onClick={() => setShowDeleteModal(showDetail)}
                  className="w-full py-3 text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50">
                  Eliminar Inversión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Cobrar Rendimiento</h3>
            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                <input type="number" step="0.01" value={returnForm.amount} onChange={e => setReturnForm({ ...returnForm, amount: e.target.value })} required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input type="date" value={returnForm.date} onChange={e => setReturnForm({ ...returnForm, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
                <input type="text" value={returnForm.notes} onChange={e => setReturnForm({ ...returnForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReturnModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recover Modal */}
      {showRecoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Recuperar Base</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Confirmas que recuperaste los <span className="font-bold">${Number(showRecoverModal.amount).toLocaleString()}</span> de <span className="font-bold">{showRecoverModal.name}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRecoverModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl">Cancelar</button>
              <button onClick={handleRecover} disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-50">
                {isSubmitting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar Inversión</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Eliminar <span className="font-bold">{showDeleteModal.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
