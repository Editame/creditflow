import { Plan, DeploymentMode, SubscriptionStatus } from '../enums';

export interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  mode: DeploymentMode;
  plan: Plan;
  activo: boolean;
  maxRutas: number;
  maxClientes: number;
  maxUsuarios: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantWithCounts extends Tenant {
  _count: {
    usuarios: number;
    rutas: number;
    clientes: number;
    prestamos: number;
  };
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: Plan;
  contactEmail: string;
}

export interface UpdateTenantDto {
  nombre?: string;
  plan?: Plan;
  activo?: boolean;
  maxRutas?: number;
  maxClientes?: number;
  maxUsuarios?: number;
}
