import { Plan, FeatureModule } from '@creditflow/shared-types';
export interface LicenseLimits {
    maxRutas: number;
    maxClientes: number;
    maxUsuarios: number;
}
export interface LicensePayload {
    licenseId: string;
    tenantName: string;
    contactEmail: string;
    plan: Plan;
    modules: FeatureModule[];
    limits: LicenseLimits;
    issuedAt: string;
    expiresAt: string | null;
    supportEndsAt: string | null;
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
