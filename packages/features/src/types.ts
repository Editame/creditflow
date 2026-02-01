import { Plan, FeatureModule, DeploymentMode } from '@creditflow/shared-types';
import { LicensePayload } from '@creditflow/licensing';

export interface FeatureLimits {
  maxRutas: number;
  maxClientes: number;
  maxUsuarios: number;
}

export interface FeatureContext {
  mode: DeploymentMode;
  plan: Plan;
  modules: FeatureModule[];
  limits: FeatureLimits;
}

export interface TenantContext {
  tenantId: string;
  plan: Plan;
  limits: FeatureLimits;
  enabledModules: FeatureModule[];
}

export interface LicenseContext {
  payload: LicensePayload;
}

export type FeatureCheckResult = {
  allowed: boolean;
  reason?: string;
};
