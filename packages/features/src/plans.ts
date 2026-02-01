import { Plan, FeatureModule } from '@creditflow/shared-types';
import { FeatureLimits } from './types';

export interface PlanDefinition {
  plan: Plan;
  modules: FeatureModule[];
  limits: FeatureLimits;
  price: {
    saas: number; // mensual
    selfHosted: number; // único
  };
}

export const PLAN_DEFINITIONS: Record<Plan, PlanDefinition> = {
  [Plan.BASICO]: {
    plan: Plan.BASICO,
    modules: [
      FeatureModule.CLIENTES_BASIC,
      FeatureModule.PRESTAMOS_BASIC,
      FeatureModule.PAGOS_BASIC,
      FeatureModule.RUTAS_BASIC,
    ],
    limits: {
      maxRutas: 1,
      maxClientes: 100,
      maxUsuarios: 2,
    },
    price: {
      saas: 29,
      selfHosted: 1999,
    },
  },
  
  [Plan.PROFESIONAL]: {
    plan: Plan.PROFESIONAL,
    modules: [
      FeatureModule.CLIENTES_BASIC,
      FeatureModule.PRESTAMOS_BASIC,
      FeatureModule.PAGOS_BASIC,
      FeatureModule.RUTAS_BASIC,
      FeatureModule.GASTOS,
      FeatureModule.REPORTES_ADVANCED,
      FeatureModule.USUARIOS_MANAGEMENT,
      FeatureModule.API_REST,
      FeatureModule.EXPORT_EXCEL,
      FeatureModule.CONCEPTOS_CUSTOM,
    ],
    limits: {
      maxRutas: 5,
      maxClientes: 500,
      maxUsuarios: 10,
    },
    price: {
      saas: 79,
      selfHosted: 4999,
    },
  },
  
  [Plan.EMPRESARIAL]: {
    plan: Plan.EMPRESARIAL,
    modules: [
      FeatureModule.CLIENTES_BASIC,
      FeatureModule.PRESTAMOS_BASIC,
      FeatureModule.PAGOS_BASIC,
      FeatureModule.RUTAS_BASIC,
      FeatureModule.GASTOS,
      FeatureModule.REPORTES_ADVANCED,
      FeatureModule.USUARIOS_MANAGEMENT,
      FeatureModule.API_REST,
      FeatureModule.EXPORT_EXCEL,
      FeatureModule.CONCEPTOS_CUSTOM,
      FeatureModule.WHITE_LABEL,
      FeatureModule.CUSTOM_DOMAIN,
      FeatureModule.WEBHOOKS,
      FeatureModule.SSO,
      FeatureModule.AUDIT_LOGS,
      FeatureModule.CUSTOM_REPORTS,
    ],
    limits: {
      maxRutas: 999,
      maxClientes: 9999,
      maxUsuarios: 100,
    },
    price: {
      saas: 199,
      selfHosted: 9999,
    },
  },
};

export function getPlanDefinition(plan: Plan): PlanDefinition {
  return PLAN_DEFINITIONS[plan];
}

export function getModulesByPlan(plan: Plan): FeatureModule[] {
  return PLAN_DEFINITIONS[plan].modules;
}

export function getLimitsByPlan(plan: Plan): FeatureLimits {
  return PLAN_DEFINITIONS[plan].limits;
}
