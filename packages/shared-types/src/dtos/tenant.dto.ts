import { Plan, DeploymentMode } from '../enums';

export interface CreateTenantDto {
  name: string;
  slug: string;
  mode?: DeploymentMode;
  plan?: Plan;
  maxRoutes?: number;
  maxClients?: number;
  maxUsers?: number;
}

export interface UpdateTenantDto {
  name?: string;
  active?: boolean;
  plan?: Plan;
  maxRoutes?: number;
  maxClients?: number;
  maxUsers?: number;
}
