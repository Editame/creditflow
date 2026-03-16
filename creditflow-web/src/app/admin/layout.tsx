'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
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
      } else if (user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}