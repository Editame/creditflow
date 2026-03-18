'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Key,
  Download,
  Eye,
  Calendar,
  Mail,
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxUsers: number;
  maxRoutes: number;
  maxClients: number;
}

interface LicensePreview {
  tenant: string;
  plan: string;
  limits: { users: number; routes: number; clients: number };
  enabledModules: string[];
  expiresAt?: string;
  supportEndsAt?: string;
  licenseKey: string;
}

export default function GenerateLicensePage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<LicensePreview | null>(null);

  const [formData, setFormData] = useState({
    contactEmail: '',
    expiresAt: '',
    supportEndsAt: '',
  });

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  const fetchTenant = async () => {
    try {
      const tenants = await api.admin.getTenants();
      const found = tenants.find((t: any) => t.id === tenantId);
      if (!found) {
        showError('Error', 'Tenant no encontrado');
        router.push('/admin');
        return;
      }
      setTenant(found);
      const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        contactEmail: `admin@${found.slug}.com`,
        expiresAt: oneYear,
        supportEndsAt: oneYear,
      }));
    } catch {
      showError('Error', 'No se pudieron cargar los datos del tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const data = await api.admin.previewLicense(tenantId, formData);
      setPreview(data);
      success('Vista previa generada', 'Revisa los detalles antes de generar');
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo generar la vista previa');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!preview) {
      showError('Error', 'Genera una vista previa primero');
      return;
    }
    setIsGenerating(true);
    try {
      const blob = await api.admin.downloadLicense(tenantId, formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-${tenant!.slug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Licencia generada', `Archivo license-${tenant!.slug}.json descargado`);
    } catch (err: any) {
      showError('Error', err.response?.data?.message || 'No se pudo generar la licencia');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLicenseKey = () => {
    if (preview?.licenseKey) {
      navigator.clipboard.writeText(preview.licenseKey);
      success('Copiado', 'Clave de licencia copiada al portapapeles');
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
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
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Generar Licencia</h1>
              <p className="text-sm text-gray-500">{tenant?.name} ({tenant?.plan})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">Self-Hosted License</span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Generación de Licencia</h4>
              <p className="text-sm text-yellow-700">
                La licencia se generará con firma RSA basada en la configuración actual de módulos del tenant.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Tenant Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Tenant</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-500">Nombre</label>
              <p className="font-medium text-gray-900">{tenant?.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Slug</label>
              <p className="font-medium text-gray-900">{tenant?.slug}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Plan</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                tenant?.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                tenant?.plan === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {tenant?.plan}
              </span>
            </div>
          </div>
        </div>

        {/* License Configuration */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Licencia</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email de Contacto
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                placeholder="admin@empresa.com"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Soporte Hasta
                </label>
                <input
                  type="date"
                  value={formData.supportEndsAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportEndsAt: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {isPreviewing ? 'Generando...' : 'Vista Previa'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa de Licencia</h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Tenant</label>
                  <p className="font-medium text-gray-900">{preview.tenant}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Plan</label>
                  <p className="font-medium text-gray-900">{preview.plan}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Límites</label>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {preview.limits.users} usuarios
                  </span>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    {preview.limits.routes} rutas
                  </span>
                  <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {preview.limits.clients} clientes
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Módulos Habilitados ({preview.enabledModules.length})</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preview.enabledModules.map(mod => (
                    <span key={mod} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      {mod}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Clave de Licencia</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">{preview.licenseKey}</code>
                  <button onClick={copyLicenseKey} className="p-1 hover:bg-gray-200 rounded transition-colors" title="Copiar">
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {(preview.expiresAt || preview.supportEndsAt) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preview.expiresAt && (
                    <div>
                      <label className="text-sm text-gray-500">Expira</label>
                      <p className="font-medium text-gray-900">{new Date(preview.expiresAt).toLocaleDateString('es-ES')}</p>
                    </div>
                  )}
                  {preview.supportEndsAt && (
                    <div>
                      <label className="text-sm text-gray-500">Soporte hasta</label>
                      <p className="font-medium text-gray-900">{new Date(preview.supportEndsAt).toLocaleDateString('es-ES')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">
                Licencia lista para generar con firma RSA. Se guardará registro en la base de datos.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl disabled:opacity-50 hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generando Licencia...' : 'Generar y Descargar Licencia'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Instrucciones para el Cliente
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
            <li>Descargar el archivo de licencia generado</li>
            <li>Copiar el archivo a la raíz de la instalación de CreditFlow</li>
            <li>Renombrar el archivo a <code className="bg-blue-100 px-1 rounded">license.json</code></li>
            <li>Reiniciar la aplicación CreditFlow</li>
            <li>El sistema validará automáticamente la licencia y aplicará la configuración</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
