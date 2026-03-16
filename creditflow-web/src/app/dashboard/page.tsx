'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, CreditCard, MapPin, DollarSign, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalClientes: number;
  totalPrestamos: number;
  totalRutas: number;
  recaudadoHoy: number;
  prestamosActivos: number;
  clientesActivos: number;
  cobranzaPendiente: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalPrestamos: 0,
    totalRutas: 0,
    recaudadoHoy: 0,
    prestamosActivos: 0,
    clientesActivos: 0,
    cobranzaPendiente: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Implementar llamada a API para estadísticas
      // Datos mock por ahora
      setStats({
        totalClientes: 0,
        totalPrestamos: 0,
        totalRutas: 0,
        recaudadoHoy: 0,
        prestamosActivos: 0,
        clientesActivos: 0,
        cobranzaPendiente: 0
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
      label: 'Cobranza Pendiente',
      value: `$${stats.cobranzaPendiente.toLocaleString()}`,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      icon: Calendar,
      label: 'Clientes Activos',
      value: stats.clientesActivos.toString(),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span>Acciones Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all group">
              <Users className="text-blue-600 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-blue-800">Nuevo Cliente</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all group">
              <CreditCard className="text-green-600 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-green-800">Nuevo Préstamo</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all group">
              <MapPin className="text-purple-600 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-purple-800">Nueva Ruta</span>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-all group">
              <DollarSign className="text-emerald-600 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-emerald-800">Registrar Pago</span>
            </button>
          </div>
        </CardContent>
      </Card>

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
