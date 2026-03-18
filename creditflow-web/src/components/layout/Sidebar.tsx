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
  Menu,
  X,
  BarChart3,
  Building2
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  feature?: string; // Feature requerida para mostrar este item
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
  const [isOpen, setIsOpen] = useState(false);

  const enabledFeatures = user?.enabledFeatures || [];
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.feature) return true;
    if (isSuperAdmin) return true;
    return enabledFeatures.includes(item.feature);
  });

  const planLabel = user?.tenant?.plan || 'Básico';

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-600 to-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  CreditFlow
                </h1>
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
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-800 font-semibold border border-slate-200 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }
                  `}
                >
                  <Icon 
                    size={20} 
                    className={`transition-colors ${
                      isActive ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'
                    }`} 
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-slate-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
            
            {/* Admin Menu Items */}
            {user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role) && (
              <>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Administración</p>
                </div>
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 font-semibold border border-orange-200 shadow-sm' 
                          : 'text-slate-600 hover:bg-orange-50 hover:text-orange-800'
                        }
                      `}
                    >
                      <Icon 
                        size={20} 
                        className={`transition-colors ${
                          isActive ? 'text-orange-700' : 'text-slate-500 group-hover:text-orange-700'
                        }`} 
                      />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-orange-600 rounded-full"></div>
                      )}
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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
        </div>
      </aside>
    </>
  );
}
