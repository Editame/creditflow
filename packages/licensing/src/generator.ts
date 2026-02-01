import { sign } from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { Plan, FeatureModule } from '@creditflow/shared-types';
import { 
  LicensePayload, 
  SignedLicense, 
  GenerateLicenseConfig,
  LicenseLimits 
} from './types';

export class LicenseGenerator {
  private privateKey: string;
  
  constructor(privateKeyPath: string) {
    this.privateKey = readFileSync(privateKeyPath, 'utf8');
  }
  
  generate(config: GenerateLicenseConfig): SignedLicense {
    const payload: LicensePayload = {
      licenseId: this.generateLicenseId(),
      tenantName: config.tenantName,
      contactEmail: config.contactEmail,
      plan: config.plan,
      modules: this.getModulesByPlan(config.plan),
      limits: this.getLimitsByPlan(config.plan),
      issuedAt: new Date().toISOString(),
      expiresAt: config.perpetual ? null : this.calculateExpiration(1),
      supportEndsAt: this.calculateExpiration(config.supportYears),
      version: '1.0.0',
    };
    
    const signature = sign(payload, this.privateKey, {
      algorithm: 'RS256',
    });
    
    return { payload, signature };
  }
  
  private getModulesByPlan(plan: Plan): FeatureModule[] {
    const baseModules: FeatureModule[] = [
      FeatureModule.CLIENTES_BASIC,
      FeatureModule.PRESTAMOS_BASIC,
      FeatureModule.PAGOS_BASIC,
      FeatureModule.RUTAS_BASIC,
    ];
    
    const professionalModules: FeatureModule[] = [
      ...baseModules,
      FeatureModule.GASTOS,
      FeatureModule.REPORTES_ADVANCED,
      FeatureModule.USUARIOS_MANAGEMENT,
      FeatureModule.API_REST,
      FeatureModule.EXPORT_EXCEL,
      FeatureModule.CONCEPTOS_CUSTOM,
    ];
    
    const enterpriseModules: FeatureModule[] = [
      ...professionalModules,
      FeatureModule.WHITE_LABEL,
      FeatureModule.CUSTOM_DOMAIN,
      FeatureModule.WEBHOOKS,
      FeatureModule.SSO,
      FeatureModule.AUDIT_LOGS,
      FeatureModule.CUSTOM_REPORTS,
    ];
    
    const planModules: Record<Plan, FeatureModule[]> = {
      [Plan.BASICO]: baseModules,
      [Plan.PROFESIONAL]: professionalModules,
      [Plan.EMPRESARIAL]: enterpriseModules,
    };
    
    return planModules[plan];
  }
  
  private getLimitsByPlan(plan: Plan): LicenseLimits {
    const planLimits: Record<Plan, LicenseLimits> = {
      [Plan.BASICO]: {
        maxRutas: 1,
        maxClientes: 100,
        maxUsuarios: 2,
      },
      [Plan.PROFESIONAL]: {
        maxRutas: 5,
        maxClientes: 500,
        maxUsuarios: 10,
      },
      [Plan.EMPRESARIAL]: {
        maxRutas: 999,
        maxClientes: 9999,
        maxUsuarios: 100,
      },
    };
    
    return planLimits[plan];
  }
  
  private calculateExpiration(years: number): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString();
  }
  
  private generateLicenseId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `LIC-${timestamp}-${random}`;
  }
}
