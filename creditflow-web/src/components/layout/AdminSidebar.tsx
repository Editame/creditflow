'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Key, 
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  BarChart3,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Building2, label: 'Empresas', href: '/admin/tenants' },
  { icon: Users, label: 'Usuarios', href: '/admin/users' },
  { icon: Key, label: 'Licencias', href: '/admin/licenses' },
  { icon: BarChart3, label: 'Reportes', href: '/admin/reports' },
  { icon: Shield, label: 'Seguridad', href: '/admin/security' },
  { icon: Settings, label: 'Configuración', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-yellow-600 text-white shadow-lg"
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
          w-64 bg-gradient-to-b from-yellow-50 to-white border-r border-yellow-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-yellow-200 bg-gradient-to-r from-yellow-500 to-yellow-400">
            <div className="flex items-center space-x-2">
              <Crown className="text-white" size={28} />
              <div>
                <h1 className="text-xl font-bold text-white">
                  CreditFlow Admin
                </h1>
                <p className="text-yellow-100 text-sm">Panel de Control</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-yellow-600 bg-opacity-20 rounded-lg">
              <p className="text-white text-sm font-medium">{user?.username}</p>
              <p className="text-yellow-100 text-xs">SUPER ADMIN</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-yellow-100 text-yellow-800 font-medium border border-yellow-200' 
                      : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-700'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Info */}
          <div className="p-4 border-t border-yellow-200 bg-yellow-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema Operativo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Modo SaaS Multi-Tenant</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-yellow-200">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}