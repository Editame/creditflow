'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, CreditCard } from 'lucide-react';

export default function ReportesPage() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalPrestamos: 0,
    totalPagos: 0,
    totalGastos: 0,
    prestamosActivos: 0,
    montoTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [clientes, prestamos, pagos, gastos] = await Promise.all([
        api.clients.getAll(),
        api.loans.getAll(),
        api.payments.getAll(),
        api.expenses.getAll(),
      ]);

      const activos = prestamos.filter((p: any) => p.status === 'ACTIVE');
      const montoTotal = prestamos.reduce((sum: number, p: any) => sum + Number(p.loanAmount), 0);

      setStats({
        totalClientes: clientes.length,
        totalPrestamos: prestamos.length,
        totalPagos: pagos.length,
        totalGastos: gastos.length,
        prestamosActivos: activos.length,
        montoTotal,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reportes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Préstamos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.prestamosActivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Monto Total Prestado</p>
                <p className="text-2xl font-bold text-gray-900">${stats.montoTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Pagos</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPagos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Gastos</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalGastos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Total Préstamos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPrestamos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Tasa de Cobranza</span>
              <span className="font-semibold text-gray-900">
                {stats.totalPrestamos > 0 ? ((stats.totalPagos / stats.totalPrestamos) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Promedio por Préstamo</span>
              <span className="font-semibold text-gray-900">
                ${stats.totalPrestamos > 0 ? (stats.montoTotal / stats.totalPrestamos).toFixed(2) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Clientes con Préstamos Activos</span>
              <span className="font-semibold text-gray-900">{stats.prestamosActivos}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
