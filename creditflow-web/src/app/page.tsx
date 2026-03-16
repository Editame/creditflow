'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-600 border-r-transparent mb-4"></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">CreditFlow</h1>
        <p className="text-slate-600">Cargando sistema...</p>
      </div>
    </div>
  );
}
