'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, CreditCard, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { icon: Users, label: 'Clientes', value: '0', color: 'text-primary-600', bg: 'bg-primary-50' },
    { icon: CreditCard, label: 'Préstamos', value: '0', color: 'text-secondary-600', bg: 'bg-secondary-50' },
    { icon: MapPin, label: 'Rutas', value: '0', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: DollarSign, label: 'Recaudado Hoy', value: '$0', color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Bienvenido, {user?.username}
        </h1>
        <p className="text-gray-600 mt-1">Rol: {user?.role}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema Configurado ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Frontend conectado</p>
            <p>✅ Autenticación funcionando</p>
            <p>✅ Usuario: {user?.username}</p>
            <p>✅ Rol: {user?.role}</p>
            <p>✅ Tenant ID: {user?.tenantId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
