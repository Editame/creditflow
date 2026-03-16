'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Plus,
  Shield,
  Settings,
  Check,
  X,
  Edit,
  Key
} from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Array<{
    permission: Permission;
  }>;
}

export default function RolesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedPermissions: [] as number[]
  });

  // Verificar permisos
  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/roles').then(r => r.json()),
        fetch('/api/permissions').then(r => r.json())
      ]);
      
      setRoles(rolesRes || []);
      setPermissions(permissionsRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      selectedPermissions: []
    });
    setEditingRole(null);
    setError('');
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      selectedPermissions: role.permissions.map(p => p.permission.id)
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (editingRole) {
        // Actualizar permisos del rol
        await fetch(`/api/roles/${editingRole.id}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionIds: formData.selectedPermissions })
        });
      } else {
        // Crear nuevo rol
        const newRole = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name })
        }).then(r => r.json());

        // Asignar permisos al nuevo rol
        if (formData.selectedPermissions.length > 0) {
          await fetch(`/api/roles/${newRole.id}/permissions`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissionIds: formData.selectedPermissions })
          });
        }
      }

      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError('Error al guardar rol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  // Agrupar permisos por módulo
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/gestion')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Roles y Permisos</h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Info Card */}\n        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Sistema de Permisos</h4>
              <p className="text-sm text-blue-700">
                Crea roles personalizados y asigna permisos específicos. Los usuarios tendrán 
                su rol base (COLLECTOR, SUPERVISOR, etc.) más los permisos adicionales del rol personalizado.
              </p>
            </div>
          </div>
        </div>

        {/* Roles List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      {role.description && (
                        <p className="text-sm text-gray-500">{role.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(role)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Permisos del rol */}
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Permisos asignados ({role.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.length === 0 ? (
                      <span className="text-sm text-gray-400 italic">Sin permisos asignados</span>
                    ) : (
                      role.permissions.map((rp) => (
                        <span
                          key={rp.permission.id}
                          className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                        >
                          {rp.permission.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}

            {roles.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-1">No hay roles personalizados</p>
                <p className="text-gray-500 text-sm mb-6">Crea tu primer rol personalizado</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  Crear rol
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRole ? 'Editar Rol' : 'Nuevo Rol Personalizado'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              {!editingRole && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Rol</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: COBRADOR_ZONA_NORTE"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usa MAYÚSCULAS y guiones bajos. Ej: COBRADOR_RUTA_1, SUPERVISOR_ZONA_SUR
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Permisos Disponibles</h4>
                
                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                  <div key={module} className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      {module}
                    </h5>
                    <div className="grid grid-cols-1 gap-2 ml-6">
                      {modulePermissions.map((permission) => {
                        const isSelected = formData.selectedPermissions.includes(permission.id);
                        
                        return (
                          <button
                            key={permission.id}
                            type="button"
                            onClick={() => togglePermission(permission.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-medium">{permission.name}</p>
                              <p className="text-sm opacity-75">{permission.description}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-white" />
                              ) : (
                                <X className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl active:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-purple-600 text-white font-medium rounded-xl active:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingRole ? 'Actualizar' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}