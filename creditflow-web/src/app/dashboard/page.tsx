'use client';

import { Users, CreditCard, MapPin, DollarSign, TrendingUp, Calendar, AlertCircle, Receipt, BarChart3, Wallet, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ROLE_LABELS, UserRole } from '@creditflow/shared-types';

interface DashboardStats {
  totalClientes: number;
  totalRutas: number;
  prestamosActivos: number;
  prestamosMora: number;
  recaudadoHoy: number;
  esperadoHoy: number;
  prestadoHoy: number;
  gastosHoy: number;
  liquidadoDia: number;
  saldoCaja: number;
  carteraActiva: number;
  carteraMora: number;
  tasaRecuperacion: number;
  tasaMorosidad: number;
  cobranzaPendiente: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0, totalRutas: 0, prestamosActivos: 0, prestamosMora: 0,
    recaudadoHoy: 0, esperadoHoy: 0, prestadoHoy: 0, gastosHoy: 0,
    liquidadoDia: 0, saldoCaja: 0, carteraActiva: 0, carteraMora: 0,
    tasaRecuperacion: 0, tasaMorosidad: 0, cobranzaPendiente: 0,
  });
  const [loading, setLoading] = useState(true);

  const [investmentStats, setInvestmentStats] = useState<any>(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const s = await api.dashboard.getSummary();
      setStats({
        totalClientes: s.totals?.clients || 0,
        totalRutas: s.totals?.routes || 0,
        prestamosActivos: s.indicators?.activeLoans || 0,
        prestamosMora: s.indicators?.overdueLoans || 0,
        recaudadoHoy: s.metrics?.collectedToday || 0,
        esperadoHoy: s.metrics?.expectedToday || 0,
        prestadoHoy: s.metrics?.lentToday || 0,
        gastosHoy: s.metrics?.expensesToday || 0,
        liquidadoDia: s.metrics?.liquidatedDay || 0,
        saldoCaja: s.totals?.cashBalance || 0,
        carteraActiva: s.indicators?.activePortfolio || 0,
        carteraMora: s.indicators?.overduePortfolio || 0,
        tasaRecuperacion: s.indicators?.recoveryRate || 0,
        tasaMorosidad: s.indicators?.delinquencyRate || 0,
        cobranzaPendiente: s.indicators?.activePortfolio || 0,
      });
      if (s.investments) setInvestmentStats(s.investments);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainStats = [
    { icon: Users, label: 'Clientes', value: stats.totalClientes.toString(), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { icon: CreditCard, label: 'Préstamos', value: stats.prestamosActivos.toString(), color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { icon: MapPin, label: 'Rutas', value: stats.totalRutas.toString(), color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { icon: DollarSign, label: 'Recaudado Hoy', value: `$${stats.recaudadoHoy.toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  const secondaryStats = [
    { icon: TrendingUp, label: 'Cartera Activa', value: `$${stats.carteraActiva.toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: AlertCircle, label: 'En Mora', value: `${stats.prestamosMora} ($${stats.carteraMora.toLocaleString()})`, color: 'text-red-600', bg: 'bg-red-50' },
    { icon: Calendar, label: 'Recuperación', value: `${stats.tasaRecuperacion}%`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: DollarSign, label: 'Liquidado Día', value: `$${stats.liquidadoDia.toLocaleString()}`, color: stats.liquidadoDia >= 0 ? 'text-green-600' : 'text-red-600', bg: stats.liquidadoDia >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ];

  const enabledFeatures = user?.enabledFeatures || [];
  const hasFeature = (f: string) => enabledFeatures.includes(f);

  const quickActions = [
    { icon: Users, label: 'Nuevo Cliente', href: '/dashboard/clientes/nuevo', feature: 'CLIENTS_BASIC', bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: CreditCard, label: 'Nuevo Préstamo', href: '/dashboard/prestamos/nuevo', feature: 'LOANS_BASIC', bg: 'bg-green-50', color: 'text-green-600' },
    { icon: DollarSign, label: 'Registrar Pago', href: '/dashboard/pagos', feature: 'PAYMENTS_BASIC', bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { icon: Receipt, label: 'Nuevo Gasto', href: '/dashboard/gastos', feature: 'EXPENSES', bg: 'bg-orange-50', color: 'text-orange-600' },
    { icon: BarChart3, label: 'Reportes', href: '/dashboard/reportes', feature: 'REPORTS_ADVANCED', bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { icon: TrendingUp, label: 'Inversiones', href: '/dashboard/inversiones', feature: 'INVESTMENTS', bg: 'bg-teal-50', color: 'text-teal-600' },
  ];

  const visibleActions = quickActions.filter(a => hasFeature(a.feature));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
              Hola, {user?.fullName || user?.username}
            </h1>
            <p className="text-slate-500 text-xs lg:text-sm mt-1">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs text-slate-500">Rol</p>
            <p className="text-sm font-semibold text-slate-700">{ROLE_LABELS[user?.role as UserRole] || user?.role}</p>
          </div>
        </div>
      </div>

      {/* Saldo en Caja - Destacado */}
      <div className="bg-white rounded-xl border border-amber-200 border-l-4 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs lg:text-sm font-medium text-slate-500">Saldo en Caja</p>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900">${stats.saldoCaja.toLocaleString()}</p>
          </div>
          <div className="p-2.5 lg:p-3 rounded-xl bg-amber-50">
            <Wallet className="text-amber-600 w-5 h-5 lg:w-6 lg:h-6" />
          </div>
        </div>
      </div>

      {/* Main Stats Grid - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-white rounded-xl border-l-4 ${stat.border} p-3 lg:p-6 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] lg:text-sm font-medium text-slate-500 truncate">{stat.label}</p>
                  <p className="text-lg lg:text-3xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                </div>
                <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${stat.bg} ml-2 flex-shrink-0`}>
                  <Icon className={`${stat.color} w-4 h-4 lg:w-6 lg:h-6`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Stats - 2 cols mobile, 2 cols desktop */}
      <div className="grid grid-cols-2 gap-3 lg:gap-6">
        {secondaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-3 lg:p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 lg:gap-4">
                <div className={`p-2 lg:p-3 rounded-lg ${stat.bg} flex-shrink-0`}>
                  <Icon className={`${stat.color} w-4 h-4 lg:w-5 lg:h-5`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] lg:text-sm font-medium text-slate-500 truncate">{stat.label}</p>
                  <p className="text-sm lg:text-xl font-bold text-slate-900 truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Investment Stats - only if feature enabled */}
      {investmentStats && (
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm lg:text-base font-semibold text-teal-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 lg:w-5 lg:h-5 text-teal-600" /> Inversiones
            </h3>
            <button onClick={() => router.push('/dashboard/inversiones')} className="text-xs text-teal-600 font-medium hover:underline">Ver todo →</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] lg:text-xs text-teal-600">Invertido</p>
              <p className="text-sm lg:text-lg font-bold text-teal-900">${investmentStats.totalInvested.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] lg:text-xs text-teal-600">Cobrado (mes)</p>
              <p className="text-sm lg:text-lg font-bold text-teal-900">${investmentStats.collectedThisMonth.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] lg:text-xs text-teal-600">Activas</p>
              <p className="text-sm lg:text-lg font-bold text-teal-900">{investmentStats.activeCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {visibleActions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 lg:p-6">
          <h3 className="text-sm lg:text-lg font-semibold text-slate-900 mb-3 lg:mb-4 px-1">Acciones Rápidas</h3>
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4">
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`flex flex-col items-center gap-1.5 lg:gap-2 p-3 lg:p-4 ${action.bg} rounded-xl active:scale-95 transition-transform`}
                >
                  <Icon className={`${action.color} w-5 h-5 lg:w-6 lg:h-6`} />
                  <span className={`text-[10px] lg:text-sm font-medium ${action.color} text-center leading-tight`}>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
