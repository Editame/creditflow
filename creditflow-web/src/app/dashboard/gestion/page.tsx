'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Settings,
  Users,
  MapPin,
  Shield,
  BarChart3,
  Building2,
  ChevronRight,
  Crown,
  UserCheck,
  Route,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function GestionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats] = useState({
    usuarios: 0,
    rutas: 0,
    roles: 0,
    permisos: 0
  });

  // Verificar permisos
  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const gestionModules = [
    {
      title: 'Usuarios',
      description: 'Gestionar usuarios del tenant',
      icon: Users,
      href: '/dashboard/gestion/usuarios',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      count: stats.usuarios,
      available: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    },
    {
      title: 'Rutas',
      description: 'Administrar rutas de cobranza',
      icon: MapPin,
      href: '/dashboard/rutas',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      count: stats.rutas,
      available: true
    },
    {
      title: 'Roles y Permisos',
      description: 'Configurar roles personalizados',
      icon: Shield,
      href: '/dashboard/gestion/roles',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      count: stats.roles,
      available: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    },
    {
      title: 'Configuración',
      description: 'Ajustes del tenant',
      icon: Settings,
      href: '/dashboard/gestion/configuracion',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      count: null,
      available: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    }
  ];

  // Solo mostrar si es ADMIN o SUPER_ADMIN
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 px-4 pt-4 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Gestión del Sistema</h1>
        </div>

        {/* Tenant Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Panel de Administración</h2>
            <p className="text-slate-200 text-sm">
              {user.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador del Tenant'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">
                Acceso Completo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-14 space-y-4 pb-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-500">Usuarios Activos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.usuarios}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-500">Rutas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.rutas}</p>
          </div>
        </div>

        {/* Management Modules */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Módulos de Gestión
          </h3>
          
          <div className="space-y-3">
            {gestionModules.filter(module => module.available).map((module) => {
              const Icon = module.icon;
              
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${module.color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{module.title}</p>
                      <p className="text-sm text-gray-500">{module.description}</p>
                      {module.count !== null && (
                        <p className="text-xs text-gray-400 mt-1">
                          {module.count} registros
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            Información del Sistema
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Rol Actual:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'SUPER_ADMIN' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Usuario:</span>
              <span className="font-medium text-gray-900">{user.username}</span>
            </div>
            
            {user.email && (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Estado:</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">Acceso Administrativo</h4>
              <p className="text-sm text-amber-700">
                Tienes permisos de administrador. Usa estas herramientas con cuidado 
                ya que pueden afectar el funcionamiento del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}