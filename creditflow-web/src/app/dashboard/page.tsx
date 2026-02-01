'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CreditFlow</h1>
            <p className="text-sm text-gray-600">
              Bienvenido, {user.username} ({user.role})
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Clientes</h2>
            <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
            <p className="mt-1 text-sm text-gray-600">Total de clientes</p>
          </div>

          {/* Card 2 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Préstamos</h2>
            <p className="mt-2 text-3xl font-bold text-green-600">0</p>
            <p className="mt-1 text-sm text-gray-600">Préstamos activos</p>
          </div>

          {/* Card 3 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Rutas</h2>
            <p className="mt-2 text-3xl font-bold text-purple-600">0</p>
            <p className="mt-1 text-sm text-gray-600">Rutas activas</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Sistema Configurado ✅
          </h2>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>✅ Frontend conectado</p>
            <p>✅ Autenticación funcionando</p>
            <p>✅ Usuario: {user.username}</p>
            <p>✅ Rol: {user.role}</p>
            <p>✅ Tenant ID: {user.tenantId}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
