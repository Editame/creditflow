import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FeaturesService } from '../features/features.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface LicenseData {
  // Información del tenant
  tenantName: string;
  tenantSlug: string;
  contactEmail: string;
  
  // Plan y límites
  plan: string;
  maxUsers: number;
  maxRoutes: number;
  maxClients: number;
  
  // Módulos habilitados (lo más importante)
  enabledModules: string[];
  
  // Fechas
  issuedAt: string;
  expiresAt?: string;
  supportEndsAt?: string;
  
  // Metadata
  version: string;
  licenseType: 'SELF_HOSTED';
  deploymentMode: 'SELF_HOSTED';
}

interface SignedLicense {
  data: LicenseData;
  signature: string;
  publicKey: string;
}

@Injectable()
export class LicenseGeneratorService {
  constructor(
    private prisma: PrismaService,
    private featuresService: FeaturesService,
  ) {}

  async generateLicenseForTenant(tenantId: string, options?: {
    expiresAt?: Date;
    supportEndsAt?: Date;
    contactEmail?: string;
    saveToDb?: boolean;
  }): Promise<SignedLicense> {
    // 1. Obtener datos del tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            routes: true,
            clients: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // 2. Obtener módulos habilitados
    const tenantFeatures = await this.featuresService.getTenantFeatures(tenantId);
    const enabledModules = tenantFeatures
      .filter(feature => feature.enabled)
      .map(feature => feature.module);

    // 3. Crear datos de la licencia
    const licenseData: LicenseData = {
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      contactEmail: options?.contactEmail || `admin@${tenant.slug}.com`,
      
      plan: tenant.plan,
      maxUsers: tenant.maxUsers,
      maxRoutes: tenant.maxRoutes,
      maxClients: tenant.maxClients,
      
      enabledModules,
      
      issuedAt: new Date().toISOString(),
      expiresAt: options?.expiresAt?.toISOString(),
      supportEndsAt: options?.supportEndsAt?.toISOString(),
      
      version: '1.0.0',
      licenseType: 'SELF_HOSTED',
      deploymentMode: 'SELF_HOSTED',
    };

    // 4. Firmar la licencia
    const signature = this.signLicenseData(licenseData);
    const publicKey = this.getPublicKey();

    const signedLicense: SignedLicense = {
      data: licenseData,
      signature,
      publicKey,
    };

    // 5. Guardar registro en BD solo si se solicita
    if (options?.saveToDb !== false) {
      await this.prisma.license.create({
        data: {
          licenseKey: this.generateLicenseKey(tenant.slug),
          tenantName: tenant.name,
          contactEmail: licenseData.contactEmail,
          plan: tenant.plan as any,
          modules: enabledModules as any,
          maxRoutes: tenant.maxRoutes,
          maxClients: tenant.maxClients,
          maxUsers: tenant.maxUsers,
          expiresAt: options?.expiresAt,
          supportEndsAt: options?.supportEndsAt,
          version: '1.0.0',
        },
      });
    }

    return signedLicense;
  }

  async saveLicenseFile(tenantSlug: string, signedLicense: SignedLicense): Promise<string> {
    const fileName = `license-${tenantSlug}-${Date.now()}.json`;
    const filePath = path.join(process.cwd(), 'generated-licenses', fileName);
    
    // Crear directorio si no existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Guardar archivo con formato bonito
    const licenseContent = {
      // Header informativo
      _info: {
        description: 'CreditFlow Self-Hosted License',
        tenant: signedLicense.data.tenantName,
        plan: signedLicense.data.plan,
        generatedAt: new Date().toISOString(),
        instructions: [
          '1. Copy this file to your CreditFlow installation root directory',
          '2. Rename it to "license.json"',
          '3. Restart your CreditFlow application',
          '4. The system will automatically validate and apply the license'
        ]
      },
      
      // Datos legibles para el cliente
      license: {
        tenant: signedLicense.data.tenantName,
        plan: signedLicense.data.plan,
        limits: {
          users: signedLicense.data.maxUsers,
          routes: signedLicense.data.maxRoutes,
          clients: signedLicense.data.maxClients,
        },
        enabledFeatures: this.getFeatureDescriptions(signedLicense.data.enabledModules),
        validUntil: signedLicense.data.expiresAt || 'No expiration',
        supportUntil: signedLicense.data.supportEndsAt || 'No expiration',
      },
      
      // Datos firmados (lo que realmente usa el sistema)
      signedData: signedLicense,
    };

    fs.writeFileSync(filePath, JSON.stringify(licenseContent, null, 2));
    return filePath;
  }

  private signLicenseData(data: LicenseData): string {
    const privateKeyPath = path.join(process.cwd(), 'keys', 'private.pem');
    
    if (!fs.existsSync(privateKeyPath)) {
      throw new Error('Private key not found. Run npm run generate:keys first.');
    }

    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(dataString);
    return sign.sign(privateKey, 'base64');
  }

  private getPublicKey(): string {
    const publicKeyPath = path.join(process.cwd(), 'keys', 'public.pem');
    
    if (!fs.existsSync(publicKeyPath)) {
      throw new Error('Public key not found. Run npm run generate:keys first.');
    }

    return fs.readFileSync(publicKeyPath, 'utf8');
  }

  private generateLicenseKey(tenantSlug: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${tenantSlug}-${timestamp}-${random}`.toUpperCase();
  }

  private getFeatureDescriptions(modules: string[]): Record<string, string> {
    const descriptions: Record<string, string> = {
      'CLIENTS_BASIC': 'Basic client management (CRUD)',
      'LOANS_BASIC': 'Basic loan management (CRUD)',
      'PAYMENTS_BASIC': 'Basic payment registration',
      'ROUTES_BASIC': 'Basic route management',
      'EXPENSES': 'Expense tracking and budgets',
      'REPORTS_ADVANCED': 'Advanced reporting and analytics',
      'USERS_MANAGEMENT': 'User and role management',
      'API_REST': 'Full REST API access',
      'EXPORT_EXCEL': 'Excel export functionality',
      'CONCEPTS_CUSTOM': 'Custom charge concepts',
      'REFINANCING': 'Loan refinancing',
      'WHITE_LABEL': 'White label customization',
      'CUSTOM_DOMAIN': 'Custom domain support',
      'WEBHOOKS': 'Webhook notifications',
      'SSO': 'Single Sign-On integration',
      'AUDIT_LOGS': 'Audit logging',
      'CUSTOM_REPORTS': 'Custom report builder',
      'ROLES_PERMISSIONS': 'Granular permissions system',
    };

    const result: Record<string, string> = {};
    modules.forEach(module => {
      result[module] = descriptions[module] || module;
    });

    return result;
  }
}