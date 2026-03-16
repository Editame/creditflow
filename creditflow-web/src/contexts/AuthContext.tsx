'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import type { Usuario, LoginDto } from '@creditflow/shared-types';

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    const token = Cookies.get('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.auth.getProfile();
      setUser(userData);
    } catch (error) {
      Cookies.remove('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginDto): Promise<void> => {
    const response = await api.auth.login(credentials);
    Cookies.set('token', response.access_token, { expires: 7 });
    setUser(response.user);
    
    // Redirect based on user role
    if (response.user.role === 'SUPER_ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = (): void => {
    Cookies.remove('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
