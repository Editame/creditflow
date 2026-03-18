'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Users, Crown, Key, AlertTriangle, Edit, Trash2, Eye, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AdminStats {
  totalTenants: number;
  totalUsers: number;
  activeSubscriptions: number;
  expiringLicenses: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  maxUsers: number;
  maxClients: number;
  maxRoutes: number;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    routes: number;
    loans: number;
  };
}

interface CreateTenantForm {
  nombre: string;
  slug: string;
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxUsuarios: number;
  maxClientes: number;
  maxRutas: number;
  contactoEmail: string;
  adminUser: {
    username: string;
    email: string;
    password: string;
  };
}

const PLAN_LIMITS = {
  BASIC: { usuarios: 2, clientes: 100, rutas: 3 },
  PROFESSIONAL: { usuarios: 5, clientes: 1000, rutas: 10 },
  ENTERPRISE: { usuarios: 20, clientes: 5000, rutas: 50 }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; tenant: Tenant | null }>({ show: false, tenant: null });
  const [stats, setStats] = useState<AdminStats>({
    totalTenants: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    expiringLicenses: 0
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [createForm, setCreateForm] = useState<CreateTenantForm>({
    nombre: '',
    slug: '',
    plan: 'PROFESSIONAL',
    maxUsuarios: 5,
    maxClientes: 1000,
    maxRutas: 10,
    contactoEmail: '',
    adminUser: {
      username: '',
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsResponse, tenantsResponse] = await Promise.all([
        api.admin.getStats(),
        api.admin.getTenants()
      ]);
      setStats(statsResponse || {
        totalTenants: 0,
        totalUsers: 0,
        activeSubscriptions: 0,
        expiringLicenses: 0
      });
      setTenants(tenantsResponse || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Set default values on error
      setStats({
        totalTenants: 0,
        totalUsers: 0,
        activeSubscriptions: 0,
        expiringLicenses: 0
      });
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setCreateForm({
      nombre: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan as any,
      maxUsuarios: tenant.maxUsers,
      maxClientes: tenant.maxClients,
      maxRutas: tenant.maxRoutes,
      contactoEmail: '',
      adminUser: { username: '', email: '', password: '' }
    });
    setShowEditForm(true);
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    
    try {
      await api.admin.updateTenant(editingTenant.id, {
        nombre: createForm.nombre,
        plan: createForm.plan,
        maxUsuarios: createForm.maxUsuarios,
        maxClientes: createForm.maxClientes,
        maxRutas: createForm.maxRutas
      });
      
      setShowEditForm(false);
      setEditingTenant(null);
      await loadData();
      showSuccess('Empresa actualizada', `${createForm.nombre} se actualizó correctamente`);
    } catch (error: any) {
      showError('Error', error.response?.data?.message || error.message);
    }
  };

  const handleViewTenant = (tenant: Tenant) => {
    setViewingTenant(tenant);
    setShowViewModal(true);
  };

  const handleDeleteTenant = async () => {
    const tenant = confirmModal.tenant;
    if (!tenant) return;
    setConfirmModal({ show: false, tenant: null });
    try {
      await api.admin.deleteTenant(tenant.id);
      await loadData();
      showSuccess('Empresa eliminada', `${tenant.name} fue eliminada correctamente`);
    } catch (error: any) {
      showError('Error', error.response?.data?.message || error.message);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.admin.createTenant(createForm);
      
      setShowCreateForm(false);
      setCreateForm({
        nombre: '',
        slug: '',
        plan: 'PROFESSIONAL',
        maxUsuarios: 5,
        maxClientes: 1000,
        maxRutas: 10,
        contactoEmail: '',
        adminUser: { username: '', email: '', password: '' }
      });
      await loadData();
      showSuccess('Empresa creada', '¡La empresa se creó exitosamente!');
    } catch (error: any) {
      showError('Error', error.response?.data?.message || error.message);
    }
  };

  const handlePlanChange = (plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    const limits = PLAN_LIMITS[plan];
    setCreateForm(prev => ({
      ...prev,
      plan,
      maxUsuarios: limits.usuarios,
      maxClientes: limits.clientes,
      maxRutas: limits.rutas
    }));
  };

  const generateSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const adminStats = [
    { 
      icon: Building2, 
      label: 'Empresas Registradas', 
      value: (stats.totalTenants || 0).toString(), 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      icon: Users, 
      label: 'Usuarios Totales', 
      value: (stats.totalUsers || 0).toString(), 
      color: 'text-green-600', 
      bg: 'bg-green-50' 
    },
    { 
      icon: Crown, 
      label: 'Suscripciones Activas', 
      value: (stats.activeSubscriptions || 0).toString(), 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
    { 
      icon: AlertTriangle, 
      label: 'Licencias por Vencer', 
      value: (stats.expiringLicenses || 0).toString(), 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cargando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Panel de Administración SaaS
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.username} - {user?.role}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Crown className="text-yellow-500" size={24} />
          <span className="text-sm font-medium text-gray-700">SUPER ADMIN</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat) => {
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="text-primary-600" size={20} />
              <span className="font-medium text-gray-900">Nueva Empresa</span>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Key className="text-primary-600" size={20} />
              <span className="font-medium text-gray-900">Generar Licencia</span>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="text-primary-600" size={20} />
              <span className="font-medium text-gray-900">Gestionar Usuarios</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Usuarios</th>
                  <th className="text-left p-2">Clientes</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tenants) && tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{tenant.name || 'N/A'}</div>
                        <div className="text-gray-500 text-xs">{tenant.slug || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                        tenant.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.plan || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">
                      {(tenant._count?.users || 0)}/{tenant.maxUsers || 0}
                    </td>
                    <td className="p-2">
                      {(tenant._count?.clients || 0)}/{tenant.maxClients || 0}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tenant.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleViewTenant(tenant)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => window.location.href = `/admin/tenants/${tenant.id}/features`}
                          className="p-1 hover:bg-purple-100 rounded text-purple-600 transition-colors"
                          title="Configurar módulos"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => window.location.href = `/admin/tenants/${tenant.id}/license`}
                          className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                          title="Generar licencia"
                        >
                          <Key size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditTenant(tenant)}
                          className="p-1 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                          title="Editar empresa"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setConfirmModal({ show: true, tenant })}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="Eliminar empresa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(tenants) || tenants.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {loading ? 'Cargando empresas...' : 'No hay empresas registradas'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Tenant Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Nueva Empresa</h2>
              <p className="text-sm text-gray-600 mt-1">Crear una nueva empresa en el sistema</p>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCreateTenant} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Nombre de la Empresa</label>
                    <input
                      type="text"
                      value={createForm.nombre}
                      onChange={(e) => {
                        const nombre = e.target.value;
                        setCreateForm(prev => ({
                          ...prev,
                          nombre,
                          slug: generateSlug(nombre)
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Ej: Microcréditos ABC"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Slug (URL)</label>
                    <input
                      type="text"
                      value={createForm.slug}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="microcreditos-abc"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => handlePlanChange(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="BASIC">Básico</option>
                    <option value="PROFESSIONAL">Profesional</option>
                    <option value="ENTERPRISE">Empresarial</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Usuarios</label>
                    <input
                      type="number"
                      value={createForm.maxUsuarios}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxUsuarios: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Clientes</label>
                    <input
                      type="number"
                      value={createForm.maxClientes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxClientes: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Rutas</label>
                    <input
                      type="number"
                      value={createForm.maxRutas}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxRutas: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Email de Contacto</label>
                  <input
                    type="email"
                    value={createForm.contactoEmail}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, contactoEmail: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-yellow-600" />
                    Usuario Administrador
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Username</label>
                      <input
                        type="text"
                        value={createForm.adminUser.username}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          adminUser: { ...prev.adminUser, username: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="admin"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                      <input
                        type="email"
                        value={createForm.adminUser.email}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          adminUser: { ...prev.adminUser, email: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="admin@empresa.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700">Contraseña</label>
                    <input
                      type="password"
                      value={createForm.adminUser.password}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        adminUser: { ...prev.adminUser, password: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Contraseña segura"
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleCreateTenant(e);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-500 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
                >
                  <Building2 className="w-5 h-5" />
                  Crear Empresa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditForm && editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Editar Empresa</h2>
              <p className="text-sm text-gray-600 mt-1">Modificar configuración de {editingTenant.name}</p>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleUpdateTenant} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Nombre de la Empresa</label>
                    <input
                      type="text"
                      value={createForm.nombre}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Slug (Solo lectura)</label>
                    <input
                      type="text"
                      value={createForm.slug}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => handlePlanChange(e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="BASIC">Básico</option>
                    <option value="PROFESSIONAL">Profesional</option>
                    <option value="ENTERPRISE">Empresarial</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Usuarios</label>
                    <input
                      type="number"
                      value={createForm.maxUsuarios}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxUsuarios: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Clientes</label>
                    <input
                      type="number"
                      value={createForm.maxClientes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxClientes: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Rutas</label>
                    <input
                      type="number"
                      value={createForm.maxRutas}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxRutas: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      min="1"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingTenant(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={async (e) => {
                    e.preventDefault();
                    await handleUpdateTenant(e);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-500 transition-all font-medium shadow-lg flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Actualizar Empresa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Tenant Modal */}
      {showViewModal && viewingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Empresa</h2>
              <p className="text-sm text-gray-600 mt-1">{viewingTenant.name}</p>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Información General</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Nombre</label>
                        <p className="font-medium text-gray-900">{viewingTenant.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Slug</label>
                        <p className="font-medium text-gray-900">{viewingTenant.slug}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Plan</label>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          viewingTenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                          viewingTenant.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {viewingTenant.plan}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Estado</label>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          viewingTenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingTenant.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Límites y Uso</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-500">Usuarios</label>
                        <p className="font-medium text-gray-900">
                          {viewingTenant._count?.users || 0} / {viewingTenant.maxUsers}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(((viewingTenant._count?.users || 0) / viewingTenant.maxUsers) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Clientes</label>
                        <p className="font-medium text-gray-900">
                          {viewingTenant._count?.clients || 0} / {viewingTenant.maxClients}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(((viewingTenant._count?.clients || 0) / viewingTenant.maxClients) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Rutas</label>
                        <p className="font-medium text-gray-900">
                          {viewingTenant._count?.routes || 0} / {viewingTenant.maxRoutes}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(((viewingTenant._count?.routes || 0) / viewingTenant.maxRoutes) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Fechas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Fecha de Creación</label>
                      <p className="font-medium text-gray-900">
                        {new Date(viewingTenant.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingTenant(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.show && confirmModal.tenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Eliminar Empresa</h2>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar <span className="font-semibold">{confirmModal.tenant.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmModal({ show: false, tenant: null })}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTenant}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema operativo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Base de datos conectada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>API funcionando</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Modo: Multi-Tenant SaaS</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}