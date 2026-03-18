'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'SUPER_ADMIN') {
        // Redirect SUPER_ADMIN to admin panel
        router.push('/admin');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Don't render dashboard for SUPER_ADMIN
  if (user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Redirigiendo...</h1>
          <p className="text-slate-600 mt-2">Accediendo al panel de administración</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8 max-w-7xl pb-24 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
