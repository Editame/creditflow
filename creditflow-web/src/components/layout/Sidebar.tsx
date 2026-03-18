'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  DollarSign, 
  Receipt,
  LogOut,
  BarChart3,
  Building2,
  MoreHorizontal,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  feature?: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Clientes', href: '/dashboard/clientes', feature: 'CLIENTS_BASIC' },
  { icon: CreditCard, label: 'Préstamos', href: '/dashboard/prestamos', feature: 'LOANS_BASIC' },
  { icon: DollarSign, label: 'Pagos', href: '/dashboard/pagos', feature: 'PAYMENTS_BASIC' },
  { icon: Receipt, label: 'Gastos', href: '/dashboard/gastos', feature: 'EXPENSES' },
  { icon: BarChart3, label: 'Reportes', href: '/dashboard/reportes', feature: 'REPORTS_ADVANCED' },
];

const adminMenuItems: MenuItem[] = [
  { icon: Building2, label: 'Gestión', href: '/dashboard/gestion' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const enabledFeatures = user?.enabledFeatures || [];
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role);

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.feature) return true;
    if (isSuperAdmin) return true;
    return enabledFeatures.includes(item.feature);
  });

  const planLabel = user?.tenant?.plan || 'Básico';

  // Mobile: primeros 3 items fijos + "Más"
  const mobileMainItems = visibleMenuItems.slice(0, 3);
  const mobileExtraItems = [
    ...visibleMenuItems.slice(3),
    ...(isAdmin ? adminMenuItems : []),
  ];

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  const isExtraActive = mobileExtraItems.some(item => isActive(item.href));

  return (
    <>
      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-600 to-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CreditFlow</h1>
              <p className="text-slate-200 text-sm">Sistema Operativo</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-600 bg-opacity-30 rounded-lg">
            <p className="text-white text-sm font-medium">{user?.fullName || user?.username}</p>
            <p className="text-slate-200 text-xs">{user?.role}</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-800 font-semibold border border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={20} className={active ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'} />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-2 h-2 bg-slate-600 rounded-full" />}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="border-t border-slate-200 my-2" />
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Administración</p>
              </div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 font-semibold border border-orange-200 shadow-sm'
                        : 'text-slate-600 hover:bg-orange-50 hover:text-orange-800'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-orange-700' : 'text-slate-500 group-hover:text-orange-700'} />
                    <span>{item.label}</span>
                    {active && <div className="ml-auto w-2 h-2 bg-orange-600 rounded-full" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Plan Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>Plan Actual:</span>
              <span className="font-medium text-slate-800">{planLabel}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Sistema Activo</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ========== MOBILE BOTTOM NAV ========== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg min-w-0 ${
                  active ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Más button */}
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg ${
              isExtraActive ? 'text-slate-800' : 'text-slate-400'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={isExtraActive ? 2.5 : 1.8} />
            <span className={`text-[10px] ${isExtraActive ? 'font-semibold' : 'font-medium'}`}>Más</span>
          </button>
        </div>
      </nav>

      {/* ========== MOBILE "MÁS" SHEET ========== */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl safe-area-bottom animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
              <div>
                <p className="font-semibold text-slate-900">{user?.fullName || user?.username}</p>
                <p className="text-xs text-slate-500">{planLabel} · {user?.role}</p>
              </div>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100"
              >
                <X size={16} className="text-slate-600" />
              </button>
            </div>

            {/* Extra menu items */}
            <div className="p-4 space-y-1">
              {mobileExtraItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      active
                        ? 'bg-slate-100 text-slate-800 font-semibold'
                        : 'text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-slate-700' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="px-4 pb-4 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setShowMore(false); logout(); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 active:bg-red-50"
              >
                <LogOut size={20} />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
