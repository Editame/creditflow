'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Settings,
  Shield,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Route,
  DollarSign,
  UserCheck,
  Download,
  Webhook,
  Eye,
  Palette,
  Globe,
  Lock,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  maxUsers: number;
  maxRoutes: number;
  maxClients: number;
}

interface FeatureModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  requiredPlan?: string;
  isPremium?: boolean;
}

interface TenantFeature {
  id: string;
  module: string;
  enabled: boolean;
  limit?: number;
  used: number;
}

const FEATURE_MODULES: FeatureModule[] = [
  // Core Features
  { id: 'CLIENTS_BASIC', name: 'Gestión de Clientes', description: 'CRUD básico de clientes', icon: <Users className="w-5 h-5" />, category: 'Core' },
  { id: 'LOANS_BASIC', name: 'Gestión de Préstamos', description: 'CRUD básico de préstamos', icon: <CreditCard className="w-5 h-5" />, category: 'Core' },
  { id: 'PAYMENTS_BASIC', name: 'Registro de Pagos', description: 'Registro básico de pagos', icon: <DollarSign className="w-5 h-5" />, category: 'Core' },
  { id: 'ROUTES_BASIC', name: 'Gestión de Rutas', description: 'CRUD básico de rutas', icon: <Route className="w-5 h-5" />, category: 'Core' },
  
  // Advanced Features
  { id: 'EXPENSES', name: 'Control de Gastos', description: 'Gestión de gastos por ruta', icon: <FileText className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL' },
  { id: 'REPORTS_ADVANCED', name: 'Reportes Avanzados', description: 'Reportes detallados y métricas', icon: <BarChart3 className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL', isPremium: true },
  { id: 'USERS_MANAGEMENT', name: 'Gestión de Usuarios', description: 'CRUD de usuarios y roles', icon: <UserCheck className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL' },
  { id: 'API_REST', name: 'API REST', description: 'Acceso a API REST completa', icon: <Settings className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL', isPremium: true },
  { id: 'EXPORT_EXCEL', name: 'Exportar Excel', description: 'Exportación de datos a Excel', icon: <Download className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL', isPremium: true },
  { id: 'CONCEPTS_CUSTOM', name: 'Conceptos Personalizados', description: 'Conceptos de cobro personalizados', icon: <Settings className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL' },
  { id: 'REFINANCING', name: 'Refinanciamiento', description: 'Refinanciamiento de préstamos', icon: <CreditCard className="w-5 h-5" />, category: 'Advanced', requiredPlan: 'PROFESSIONAL' },
  
  // Enterprise Features
  { id: 'WHITE_LABEL', name: 'White Label', description: 'Personalización de marca', icon: <Palette className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE', isPremium: true },
  { id: 'CUSTOM_DOMAIN', name: 'Dominio Personalizado', description: 'Dominio propio para la aplicación', icon: <Globe className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE', isPremium: true },
  { id: 'WEBHOOKS', name: 'Webhooks', description: 'Notificaciones a sistemas externos', icon: <Webhook className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE', isPremium: true },
  { id: 'SSO', name: 'Single Sign-On', description: 'Autenticación única empresarial', icon: <Shield className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE', isPremium: true },
  { id: 'AUDIT_LOGS', name: 'Logs de Auditoría', description: 'Registro completo de actividades', icon: <Eye className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE' },
  { id: 'CUSTOM_REPORTS', name: 'Reportes Personalizados', description: 'Creación de reportes personalizados', icon: <BarChart3 className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE', isPremium: true },
  { id: 'ROLES_PERMISSIONS', name: 'Roles y Permisos', description: 'Sistema granular de permisos', icon: <Lock className="w-5 h-5" />, category: 'Enterprise', requiredPlan: 'ENTERPRISE' },
];

export default function TenantFeaturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [features, setFeatures] = useState<TenantFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, boolean>>({});

  // Verificar permisos
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [tenants, tenantFeatures] = await Promise.all([
        api.admin.getTenants(),
        api.admin.getTenantFeatures(id),
      ]);
      const found = tenants.find((t: any) => t.id === id);
      if (found) {
        setTenant(found);
      }
      setFeatures(Array.isArray(tenantFeatures) ? tenantFeatures : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Error', 'No se pudieron cargar los datos del tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureToggle = (moduleId: string, enabled: boolean) => {
    setChanges(prev => ({
      ...prev,
      [moduleId]: enabled
    }));
  };

  const isFeatureEnabled = (moduleId: string): boolean => {
    if (moduleId in changes) {
      return changes[moduleId];
    }
    const feature = features.find(f => f.module === moduleId);
    return feature?.enabled || false;
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) {
      showError('Sin cambios', 'No hay cambios para guardar');
      return;
    }

    setIsSaving(true);
    try {
      await api.admin.updateTenantFeatures(id, changes);
      success('Configuración guardada', 'Los módulos han sido actualizados correctamente');
      setChanges({});
      await fetchData();
    } catch (error) {
      showError('Error', 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Core': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Enterprise': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const groupedFeatures = FEATURE_MODULES.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureModule[]>);

  if (!user || user.role !== 'SUPER_ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Configuración de Módulos</h1>
              <p className="text-sm text-gray-500">{tenant?.name} ({tenant?.plan})</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || Object.keys(changes).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Gestión de Módulos</h4>
              <p className="text-sm text-blue-700">
                Configura qué módulos tiene acceso este tenant. Los módulos premium pueden cobrarse por separado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <div key={category} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{category} Features</h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getCategoryColor(category)}`}>
                  {categoryFeatures.length} módulos
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-4">
                {categoryFeatures.map((feature) => {
                  const enabled = isFeatureEnabled(feature.id);
                  const hasChanges = feature.id in changes;
                  
                  return (
                    <div
                      key={feature.id}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${
                        hasChanges ? 'border-purple-200 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {feature.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{feature.name}</h4>
                            {feature.isPremium && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                Premium
                              </span>
                            )}
                            {feature.requiredPlan && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                {feature.requiredPlan}+
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{feature.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {hasChanges && (
                          <span className="text-xs text-purple-600 font-medium">Cambio pendiente</span>
                        )}
                        <button
                          onClick={() => handleFeatureToggle(feature.id, !enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            enabled ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        {enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Changes Summary */}
      {Object.keys(changes).length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm">
          <h4 className="font-medium text-gray-900 mb-2">Cambios Pendientes</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(changes).map(([moduleId, enabled]) => {
              const feature = FEATURE_MODULES.find(f => f.id === moduleId);
              return (
                <div key={moduleId} className="flex items-center justify-between">
                  <span className="text-gray-600">{feature?.name}</span>
                  <span className={`font-medium ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {enabled ? 'Activar' : 'Desactivar'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}