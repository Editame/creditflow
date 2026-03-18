'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, CreditCard, MapPin, DollarSign, TrendingUp, Calendar, AlertCircle, Receipt, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    totalClientes: 0,
    totalRutas: 0,
    prestamosActivos: 0,
    prestamosMora: 0,
    recaudadoHoy: 0,
    esperadoHoy: 0,
    prestadoHoy: 0,
    gastosHoy: 0,
    liquidadoDia: 0,
    carteraActiva: 0,
    carteraMora: 0,
    tasaRecuperacion: 0,
    tasaMorosidad: 0,
    cobranzaPendiente: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const summary = await api.dashboard.getSummary();
      setStats({
        totalClientes: summary.totals?.clients || 0,
        totalRutas: summary.totals?.routes || 0,
        prestamosActivos: summary.indicators?.activeLoans || 0,
        prestamosMora: summary.indicators?.overdueLoans || 0,
        recaudadoHoy: summary.metrics?.collectedToday || 0,
        esperadoHoy: summary.metrics?.expectedToday || 0,
        prestadoHoy: summary.metrics?.lentToday || 0,
        gastosHoy: summary.metrics?.expensesToday || 0,
        liquidadoDia: summary.metrics?.liquidatedDay || 0,
        carteraActiva: summary.indicators?.activePortfolio || 0,
        carteraMora: summary.indicators?.overduePortfolio || 0,
        tasaRecuperacion: summary.indicators?.recoveryRate || 0,
        tasaMorosidad: summary.indicators?.delinquencyRate || 0,
        cobranzaPendiente: summary.indicators?.activePortfolio || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainStats = [
    { 
      icon: Users, 
      label: 'Clientes Totales', 
      value: stats.totalClientes.toString(), 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    { 
      icon: CreditCard, 
      label: 'Préstamos Activos', 
      value: stats.prestamosActivos.toString(), 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    { 
      icon: MapPin, 
      label: 'Rutas Activas', 
      value: stats.totalRutas.toString(), 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    { 
      icon: DollarSign, 
      label: 'Recaudado Hoy', 
      value: `$${stats.recaudadoHoy.toLocaleString()}`, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
  ];

  const secondaryStats = [
    {
      icon: TrendingUp,
      label: 'Cartera Activa',
      value: `$${stats.carteraActiva.toLocaleString()}`,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      icon: AlertCircle,
      label: 'En Mora',
      value: `${stats.prestamosMora} préstamos ($${stats.carteraMora.toLocaleString()})`,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      icon: Calendar,
      label: 'Tasa Recuperación Hoy',
      value: `${stats.tasaRecuperacion}%`,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      icon: DollarSign,
      label: 'Liquidado del Día',
      value: `$${stats.liquidadoDia.toLocaleString()}`,
      color: stats.liquidadoDia >= 0 ? 'text-green-600' : 'text-red-600',
      bg: stats.liquidadoDia >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
  ];

  const enabledFeatures = user?.enabledFeatures || [];
  const hasFeature = (f: string) => enabledFeatures.includes(f);

  const quickActions = [
    { icon: Users, label: 'Nuevo Cliente', href: '/dashboard/clientes/nuevo', feature: 'CLIENTS_BASIC', from: 'from-blue-50', to: 'to-blue-100', border: 'border-blue-200', color: 'text-blue-600', textColor: 'text-blue-800' },
    { icon: CreditCard, label: 'Nuevo Préstamo', href: '/dashboard/prestamos/nuevo', feature: 'LOANS_BASIC', from: 'from-green-50', to: 'to-green-100', border: 'border-green-200', color: 'text-green-600', textColor: 'text-green-800' },
    { icon: DollarSign, label: 'Registrar Pago', href: '/dashboard/pagos', feature: 'PAYMENTS_BASIC', from: 'from-emerald-50', to: 'to-emerald-100', border: 'border-emerald-200', color: 'text-emerald-600', textColor: 'text-emerald-800' },
    { icon: Receipt, label: 'Nuevo Gasto', href: '/dashboard/gastos', feature: 'EXPENSES', from: 'from-orange-50', to: 'to-orange-100', border: 'border-orange-200', color: 'text-orange-600', textColor: 'text-orange-800' },
    { icon: BarChart3, label: 'Reportes', href: '/dashboard/reportes', feature: 'REPORTS_ADVANCED', from: 'from-indigo-50', to: 'to-indigo-100', border: 'border-indigo-200', color: 'text-indigo-600', textColor: 'text-indigo-800' },
  ];

  const visibleActions = quickActions.filter(a => hasFeature(a.feature));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
              Bienvenido, {user?.username}
            </h1>
            <p className="text-slate-600 mt-2 flex items-center space-x-2">
              <span>Rol: {user?.role}</span>
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span>Dashboard Operativo</span>
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-500">Fecha actual</p>
              <p className="font-semibold text-slate-700">{new Date().toLocaleDateString('es-ES')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`border-l-4 ${stat.border} hover:shadow-lg transition-all duration-200`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`${stat.color} w-6 h-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {secondaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`${stat.color} w-5 h-5`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      {visibleActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <span>Acciones Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.label} onClick={() => router.push(action.href)} className={`flex items-center space-x-3 p-4 bg-gradient-to-r ${action.from} ${action.to} border ${action.border} rounded-xl hover:opacity-90 transition-all group`}>
                    <Icon className={`${action.color} w-5 h-5 group-hover:scale-110 transition-transform`} />
                    <span className={`font-medium ${action.textColor}`}>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <span>Estado del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700">Conexiones</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">Frontend conectado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">API funcionando</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">Base de datos activa</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700">Información de Usuario</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Usuario:</span>
                  <span className="text-slate-700 font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rol:</span>
                  <span className="text-slate-700 font-medium">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant ID:</span>
                  <span className="text-slate-700 font-medium">{user?.tenantId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
