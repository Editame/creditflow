'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Loan } from '@creditflow/shared-types';
import { Calendar, DollarSign, CheckCircle, User } from 'lucide-react';

export default function CobranzaPage() {
  const [prestamos, setPrestamos] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEsperado, setTotalEsperado] = useState(0);
  const [totalCobrado] = useState(0);

  useEffect(() => {
    loadCobranza();
  }, []);

  const loadCobranza = async () => {
    try {
      const data = await api.loans.getAll();
      const activos = (data as any[]).filter((p: any) => p.status === 'ACTIVE');
      setPrestamos(activos);
      
      const esperado = activos.reduce((sum: number, p: any) => sum + Number(p.installmentValue), 0);
      setTotalEsperado(esperado);
    } catch (error) {
      console.error('Error loading cobranza:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cobranza del Día</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Esperado</p>
                <p className="text-2xl font-bold text-gray-900">${totalEsperado.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Cobrado</p>
                <p className="text-2xl font-bold text-green-600">${totalCobrado.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Clientes Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{prestamos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Préstamos Activos</CardTitle>
        </CardHeader>
        <CardContent>
          {prestamos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay préstamos activos hoy</p>
          ) : (
            <div className="space-y-3">
              {prestamos.map((prestamo) => (
                <div key={prestamo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Préstamo #{String(prestamo.id).slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">Cuota: ${Number(prestamo.installmentValue).toFixed(2)}</p>
                  </div>
                  <Button size="sm" variant="primary">Cobrar</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
