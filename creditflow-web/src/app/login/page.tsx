'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Eye, EyeOff, User, Lock, Shield, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-400 p-6 rounded-full shadow-2xl">
              <Crown className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              CreditFlow
            </h1>
            <p className="text-xl text-gray-300 font-light">
              Sistema de Gestión de Microcréditos
            </p>
            <div className="flex items-center justify-center space-x-2 text-yellow-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Multi-Tenant SaaS Platform</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">Gestión de Empresas</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">Control de Licencias</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm">Reportes Avanzados</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 p-4 rounded-xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-white">CreditFlow</h1>
                <p className="text-sm text-gray-300">Admin Panel</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-gray-300 text-sm">
                Accede al panel de administración
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm text-center backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Usuario</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    required
                    autoComplete="username"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/20 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Contraseña</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/20 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all backdrop-blur-sm pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Ingresar al Panel</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs text-gray-300 text-center mb-2 font-medium">
                Credenciales de Demo:
              </p>
              <div className="text-xs text-gray-400 text-center space-y-1">
                <p><span className="text-yellow-400">Usuario:</span> admin</p>
                <p><span className="text-yellow-400">Contraseña:</span> admin123</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                CreditFlow v1.0.0 - Sistema Multi-Tenant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
