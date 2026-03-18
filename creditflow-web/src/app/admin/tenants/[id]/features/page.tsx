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
  Save,
  TrendingUp,
  Package,
  Clock
} from 'lucide-react';

interface TenantFeature {
  id: string;
  module: string;
  enabled: boolean;
}

interface FeatureDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

interface FeatureGroup {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  features: FeatureDef[];
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    label: 'Microcréditos',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      { id: 'CLIENTS_BASIC', name: 'Clientes', description: 'Gestión de clientes', icon: <Users className="w-4 h-4" /> },
      { id: 'LOANS_BASIC', name: 'Préstamos', description: 'Gestión de préstamos', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'PAYMENTS_BASIC', name: 'Pagos', description: 'Registro de pagos', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'ROUTES_BASIC', name: 'Rutas', description: 'Rutas de cobranza', icon: <Route className="w-4 h-4" /> },
      { id: 'EXPENSES', name: 'Gastos', description: 'Gastos por ruta', icon: <FileText className="w-4 h-4" /> },
      { id: 'REFINANCING', name: 'Refinanciamiento', description: 'Refinanciar préstamos', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'CONCEPTS_CUSTOM', name: 'Conceptos', description: 'Conceptos de cobro', icon: <Settings className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Inversiones',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    features: [
      { id: 'INVESTMENTS', name: 'Inversiones', description: 'Capital invertido y rendimientos', icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Gestión',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      { id: 'USERS_MANAGEMENT', name: 'Usuarios', description: 'Gestión de usuarios', icon: <UserCheck className="w-4 h-4" /> },
      { id: 'ROLES_PERMISSIONS', name: 'Roles y Permisos', description: 'Permisos granulares', icon: <Lock className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Reportes',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    features: [
      { id: 'REPORTS_ADVANCED', name: 'Reportes Avanzados', description: 'Métricas detalladas', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'EXPORT_EXCEL', name: 'Exportar Excel', description: 'Exportación de datos', icon: <Download className="w-4 h-4" /> },
      { id: 'CUSTOM_REPORTS', name: 'Reportes Personalizados', description: 'Reportes a medida', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Enterprise',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    features: [
      { id: 'WHITE_LABEL', name: 'White Label', description: 'Marca personalizada', icon: <Palette className="w-4 h-4" />, comingSoon: true },
      { id: 'CUSTOM_DOMAIN', name: 'Dominio Propio', description: 'Dominio personalizado', icon: <Globe className="w-4 h-4" />, comingSoon: true },
      { id: 'WEBHOOKS', name: 'Webhooks', description: 'Notificaciones externas', icon: <Webhook className="w-4 h-4" />, comingSoon: true },
      { id: 'SSO', name: 'Single Sign-On', description: 'Autenticación empresarial', icon: <Shield className="w-4 h-4" />, comingSoon: true },
      { id: 'AUDIT_LOGS', name: 'Logs de Auditoría', description: 'Registro de actividades', icon: <Eye className="w-4 h-4" />, comingSoon: true },
      { id: 'API_REST', name: 'API REST', description: 'Acceso programático', icon: <Settings className="w-4 h-4" />, comingSoon: true },
    ],
  },
];

export default function TenantFeaturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [tenantName, setTenantName] = useState('');
  const [tenantPlan, setTenantPlan] = useState('');
  const [features, setFeatures] = useState<TenantFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/dashboard');
  }, [user, router]);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [tenants, tenantFeatures] = await Promise.all([
        api.admin.getTenants(),
        api.admin.getTenantFeatures(id),
      ]);
      const found = tenants.find((t: any) => t.id === id);
      if (found) { setTenantName(found.name); setTenantPlan(found.plan); }
      setFeatures(Array.isArray(tenantFeatures) ? tenantFeatures : []);
    } catch {
      showError('Error', 'No se pudieron cargar los datos');
    } finally { setIsLoading(false); }
  };

  const isEnabled = (moduleId: string): boolean => {
    if (moduleId in changes) return changes[moduleId];
    return features.find(f => f.module === moduleId)?.enabled || false;
  };

  const toggle = (moduleId: string) => {
    setChanges(prev => ({ ...prev, [moduleId]: !isEnabled(moduleId) }));
  };

  const toggleGroup = (group: FeatureGroup) => {
    const availableFeatures = group.features.filter(f => !f.comingSoon);
    const allEnabled = availableFeatures.every(f => isEnabled(f.id));
    const newState = !allEnabled;
    const newChanges: Record<string, boolean> = {};
    availableFeatures.forEach(f => { newChanges[f.id] = newState; });
    setChanges(prev => ({ ...prev, ...newChanges }));
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return;
    setIsSaving(true);
    try {
      await api.admin.updateTenantFeatures(id, changes);
      success('Guardado', 'Módulos actualizados correctamente');
      setChanges({});
      await fetchData();
    } catch {
      showError('Error', 'No se pudo guardar');
    } finally { setIsSaving(false); }
  };

  const hasChanges = Object.keys(changes).length > 0;

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')}
            className="w-8 h-8 lg:w-9 lg:h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Módulos</h1>
            <p className="text-xs lg:text-sm text-gray-500">{tenantName} · {tenantPlan}</p>
          </div>
        </div>
        {hasChanges && (
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 hover:bg-purple-700 transition-colors">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        )}
      </div>

      {/* Feature Groups */}
      {FEATURE_GROUPS.map((group) => {
        const availableFeatures = group.features.filter(f => !f.comingSoon);
        const allEnabled = availableFeatures.length > 0 && availableFeatures.every(f => isEnabled(f.id));

        return (
          <div key={group.label} className={`bg-white rounded-xl border ${group.borderColor} overflow-hidden`}>
            {/* Group Header */}
            <div className={`${group.bgColor} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Package className={`w-4 h-4 ${group.color}`} />
                <h3 className={`text-sm lg:text-base font-semibold ${group.color}`}>{group.label}</h3>
                <span className="text-[10px] lg:text-xs text-gray-500">
                  {availableFeatures.filter(f => isEnabled(f.id)).length}/{availableFeatures.length}
                </span>
              </div>
              {availableFeatures.length > 1 && (
                <button onClick={() => toggleGroup(group)}
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                    allEnabled
                      ? 'bg-white/80 text-red-600 hover:bg-white'
                      : `bg-white/80 ${group.color} hover:bg-white`
                  }`}>
                  {allEnabled ? 'Desactivar todo' : 'Activar todo'}
                </button>
              )}
            </div>

            {/* Features */}
            <div className="divide-y divide-gray-100">
              {group.features.map((feature) => {
                const enabled = isEnabled(feature.id);
                const changed = feature.id in changes;
                const comingSoon = feature.comingSoon;

                return (
                  <div key={feature.id}
                    className={`flex items-center justify-between px-4 py-3 ${changed ? 'bg-purple-50' : ''} ${comingSoon ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${enabled && !comingSoon ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {feature.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{feature.name}</p>
                          {comingSoon && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap">
                              <Clock className="w-3 h-3" /> Próximamente
                            </span>
                          )}
                          {changed && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] lg:text-xs text-gray-500 truncate">{feature.description}</p>
                      </div>
                    </div>
                    {!comingSoon ? (
                      <button onClick={() => toggle(feature.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
                          enabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    ) : (
                      <Lock className="w-4 h-4 text-gray-300 flex-shrink-0 ml-3" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Floating save bar on mobile */}
      {hasChanges && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
          <button onClick={handleSave} disabled={isSaving}
            className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : `Guardar ${Object.keys(changes).length} cambios`}
          </button>
        </div>
      )}
    </div>
  );
}
