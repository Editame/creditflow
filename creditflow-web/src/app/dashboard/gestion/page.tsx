'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Settings,
  Users,
  MapPin,
  Shield,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const gestionModules = [
  {
    title: 'Capital / Caja',
    description: 'Capital y movimientos',
    icon: Wallet,
    href: '/dashboard/gestion/capital',
    color: 'from-emerald-500 to-emerald-600',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    title: 'Usuarios',
    description: 'Gestionar usuarios',
    icon: Users,
    href: '/dashboard/gestion/usuarios',
    color: 'from-blue-500 to-blue-600',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    title: 'Rutas',
    description: 'Rutas de cobranza',
    icon: MapPin,
    href: '/dashboard/rutas',
    color: 'from-green-500 to-green-600',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    title: 'Roles',
    description: 'Roles y permisos',
    icon: Shield,
    href: '/dashboard/gestion/roles',
    color: 'from-purple-500 to-purple-600',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    title: 'Configuración',
    description: 'Ajustes del tenant',
    icon: Settings,
    href: '/dashboard/gestion/configuracion',
    color: 'from-orange-500 to-orange-600',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
];

export default function GestionPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) return null;

  const available = gestionModules.filter(m => m.roles.includes(user.role));

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg lg:text-2xl font-bold text-slate-900">Gestión</h1>
          <p className="text-xs lg:text-sm text-slate-500">Administración del sistema</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {available.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.98] group"
            >
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <p className="font-semibold text-sm lg:text-base text-slate-900">{module.title}</p>
              <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5">{module.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
