'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { handleLimitError } from '@/lib/errorHandlers';
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  X,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  Crown
} from 'lucide-react';
import type { User, CreateUserDto, UpdateUserDto, UserRole } from '@creditflow/shared-types';
import { ROLE_LABELS } from '@creditflow/shared-types';

export default function GestionUsuariosPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [formData, setFormData] = useState<CreateUserDto>({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'COLLECTOR' as UserRole
  });

  // Verificar permisos
  useEffect(() => {
    if (currentUser && !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      router.push('/dashboard');
      return;
    }
  }, [currentUser, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usuariosRes = await api.users.getAll();
      setUsuarios(Array.isArray(usuariosRes) ? usuariosRes : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      username: '',
      fullName: '',
      email: '',
      password: '',
      role: 'COLLECTOR' as UserRole
    });
    setConfirmPassword('');
    setEditingUser(null);
    setError('');
    setShowPassword(false);
  };

  const handleEdit = (usuario: User) => {
    setEditingUser(usuario);
    setFormData({
      username: usuario.username,
      fullName: (usuario as any).fullName || '',
      email: usuario.email || '',
      password: '',
      role: usuario.role
    });
    setConfirmPassword('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validaciones
      if (!editingUser && formData.password !== confirmPassword) {
        showError('Error de validación', 'Las contraseñas no coinciden');
        return;
      }

      if (!editingUser && formData.password.length < 6) {
        showError('Error de validación', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }

      const payload: CreateUserDto | UpdateUserDto = {
        username: formData.username,
        fullName: formData.fullName || undefined,
        email: formData.email || undefined,
        role: formData.role,
        ...((!editingUser || formData.password) && { password: formData.password })
      };

      if (editingUser) {
        await api.users.update(editingUser.id, payload);
        success('Usuario actualizado', `${formData.username} ha sido actualizado exitosamente`);
      } else {
        await api.users.create(payload as CreateUserDto);
        success('Usuario creado', `${formData.username} ha sido creado exitosamente`);
      }

      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      const { title, message } = handleLimitError(err, 'usuarios');
      showError(title, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const usuario = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.users.delete(usuario.id);
      success('Usuario eliminado', `${usuario.username} ha sido eliminado`);
      await fetchData();
    } catch (err: any) {
      const { title, message } = handleLimitError(err, 'usuarios');
      showError(title, message);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'SUPERVISOR':
        return 'bg-blue-100 text-blue-700';
      case 'COLLECTOR':
        return 'bg-green-100 text-green-700';
      case 'ACCOUNTANT':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => ROLE_LABELS[role as UserRole] || role;

  if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
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
            <h1 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h1>
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4 py-3">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Gestión de Usuarios</h4>
              <p className="text-sm text-blue-700">
                Crea y gestiona usuarios del sistema. Cada usuario tiene un rol que define sus permisos y accesos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
          <p className="text-sm text-purple-700">
            <span className="font-semibold">{filteredUsuarios.length}</span> usuarios encontrados
          </p>
        </div>
      </div>

      {/* Users List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">No hay usuarios</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm ? 'No se encontraron resultados' : 'Crea tu primer usuario'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Crear usuario
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      {usuario.role === 'SUPER_ADMIN' ? (
                        <Crown className="w-6 h-6 text-red-600" />
                      ) : usuario.role === 'ADMIN' ? (
                        <Shield className="w-6 h-6 text-purple-600" />
                      ) : (
                        <Users className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{(usuario as any).fullName || usuario.username}</p>
                      <p className="text-sm text-gray-500">{usuario.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    {usuario.id !== currentUser?.id && (
                      <button
                        onClick={() => setDeleteTarget(usuario)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rol y Estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(usuario.role)}`}>
                    {getRoleLabel(usuario.role)}
                  </span>
                  
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    usuario.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {usuario.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar Usuario</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de eliminar a <span className="font-semibold">{deleteTarget.username}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                >
                  <option value="COLLECTOR">Cobrador</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ACCOUNTANT">Contador</option>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <>
                      <option value="ADMIN">Administrador</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
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
                  {isSubmitting ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}