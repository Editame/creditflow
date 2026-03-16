'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { Pago } from '@creditflow/shared-types';
import { Plus, DollarSign, Calendar, CreditCard, CheckCircle } from 'lucide-react';

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toasts, removeToast, success, error } = useToast();
  const [formData, setFormData] = useState({
    prestamoId: '',
    monto: '',
    metodoPago: 'EFECTIVO' as const,
  });

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      const response = await api.pagos.getAll();
      setPagos(response);
    } catch (error) {
      console.error('Error loading pagos:', error);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.pagos.create({
        loanId: parseInt(formData.prestamoId),
        paidAmount: parseFloat(formData.monto),
      });
      resetForm();
      loadPagos();
      success('Pago registrado exitosamente');
    } catch (err) {
      console.error('Error creating pago:', err);
      error('Error al registrar pago');
    }
  };

  const resetForm = () => {
    setFormData({ prestamoId: '', monto: '', metodoPago: 'EFECTIVO' });
    setShowForm(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pagos</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Préstamo ID"
                value={formData.prestamoId}
                onChange={(e) => setFormData({ ...formData, prestamoId: e.target.value })}
                required
                fullWidth
              />
              <Input
                label="Monto"
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                required
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as 'EFECTIVO' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">Registrar</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pagos.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay pagos registrados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagos.map((pago) => (
            <Card key={pago.id}>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Pago #{pago.id.toString().slice(0, 8)}</h3>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-semibold text-green-600 text-lg">${Number((pago as any).amountPaid).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="w-4 h-4" />
                      <span>{(pago as any).paidBy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date((pago as any).paymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
