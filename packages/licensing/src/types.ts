import { Plan, FeatureModule } from '@creditflow/shared-types';

export interface LicenseLimits {
  maxRutas: number;
  maxClientes: number;
  maxUsuarios: number;
}

export interface LicensePayload {
  // Identificación
  licenseId: string;
  tenantName: string;
  contactEmail: string;
  
  // Plan y features
  plan: Plan;
  modules: FeatureModule[];
  
  // Límites
  limits: LicenseLimits;
  
  // Validez
  issuedAt: string; // ISO date
  expiresAt: string | null; // null = perpetua
  supportEndsAt: string | null;
  
  // Metadata
  version: string;
}

export interface SignedLicense {
  payload: LicensePayload;
  signature: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  payload: LicensePayload | null;
  error: string | null;
  warnings: string[];
}

export interface GenerateLicenseConfig {
  tenantName: string;
  contactEmail: string;
  plan: Plan;
  perpetual: boolean;
  supportYears: number;
}
