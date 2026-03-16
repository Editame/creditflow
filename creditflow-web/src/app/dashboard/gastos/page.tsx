'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { Gasto } from '@creditflow/shared-types';
import { Plus, Receipt, Calendar, Tag, Edit, Trash2 } from 'lucide-react';

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toasts, removeToast, success, error } = useToast();
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoria: '',
  });

  useEffect(() => {
    loadGastos();
  }, []);

  const loadGastos = async () => {
    try {
      const response = await api.gastos.getAll();
      setGastos(response);
    } catch (error) {
      console.error('Error loading gastos:', error);
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        routeId: 1, // TODO: Get from context or user selection
        description: formData.descripcion,
        amount: parseFloat(formData.monto),
        category: formData.categoria,
      };
      if (editingId) {
        await api.gastos.update(parseInt(editingId), payload);
      } else {
        await api.gastos.create(payload);
      }
      resetForm();
      loadGastos();
      success(editingId ? 'Gasto actualizado' : 'Gasto creado');
    } catch (err) {
      console.error('Error saving gasto:', err);
      error('Error al guardar gasto');
    }
  };

  const handleEdit = (gasto: Gasto) => {
    setFormData({
      descripcion: gasto.description,
      monto: gasto.amount.toString(),
      categoria: gasto.category || '',
    });
    setEditingId(gasto.id.toString());
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await api.gastos.delete(id);
      loadGastos();
      success('Gasto eliminado');
    } catch (err) {
      console.error('Error deleting gasto:', err);
      error('Error al eliminar gasto');
    }
  };

  const resetForm = () => {
    setFormData({ descripcion: '', monto: '', categoria: '' });
    setEditingId(null);
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gastos</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Gasto' : 'Nuevo Gasto'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
              <Input
                label="Categoría"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                fullWidth
              />
              <div className="flex gap-2">
                <Button type="submit" variant="primary">Guardar</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {gastos.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay gastos registrados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gastos.map((gasto) => (
            <Card key={gasto.id}>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">{gasto.description}</h3>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-semibold text-red-600 text-lg">-${gasto.amount.toLocaleString()}</span>
                    </div>
                    {gasto.category && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag className="w-4 h-4" />
                        <span>{gasto.category}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(gasto.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(gasto)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(gasto.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
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
