import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FeatureModule } from '@prisma/client';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  async getTenantFeatures(tenantId: string) {
    const features = await this.prisma.tenantFeature.findMany({
      where: { tenantId },
      orderBy: { module: 'asc' },
    });

    // Si no hay features, inicializarlas según el plan del tenant
    if (features.length === 0) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) {
        await this.initializeTenantFeatures(tenantId, tenant.plan);
        return this.prisma.tenantFeature.findMany({
          where: { tenantId },
          orderBy: { module: 'asc' },
        });
      }
    }

    return features;
  }

  async updateTenantFeatures(tenantId: string, features: Record<string, boolean>) {
    const operations = [];

    for (const [module, enabled] of Object.entries(features)) {
      operations.push(
        this.prisma.tenantFeature.upsert({
          where: {
            tenantId_module: {
              tenantId,
              module: module as FeatureModule,
            },
          },
          update: { enabled },
          create: {
            tenantId,
            module: module as FeatureModule,
            enabled,
          },
        })
      );
    }

    await Promise.all(operations);
    return this.getTenantFeatures(tenantId);
  }

  async initializeTenantFeatures(tenantId: string, plan: string) {
    const defaultFeatures = this.getDefaultFeaturesForPlan(plan);
    
    const operations = defaultFeatures.map(({ module, enabled }) =>
      this.prisma.tenantFeature.upsert({
        where: {
          tenantId_module: {
            tenantId,
            module,
          },
        },
        update: { enabled },
        create: {
          tenantId,
          module,
          enabled,
        },
      })
    );

    await Promise.all(operations);
  }

  private getDefaultFeaturesForPlan(_plan: string): Array<{ module: FeatureModule; enabled: boolean }> {
    // All features start disabled — SUPER_ADMIN enables per tenant
    const allFeatures: FeatureModule[] = [
      'CLIENTS_BASIC', 'LOANS_BASIC', 'PAYMENTS_BASIC', 'ROUTES_BASIC',
      'EXPENSES', 'REPORTS_ADVANCED', 'USERS_MANAGEMENT', 'API_REST',
      'EXPORT_EXCEL', 'CONCEPTS_CUSTOM', 'REFINANCING', 'ROLES_PERMISSIONS',
      'WHITE_LABEL', 'CUSTOM_DOMAIN', 'WEBHOOKS', 'SSO',
      'AUDIT_LOGS', 'CUSTOM_REPORTS', 'INVESTMENTS',
    ] as FeatureModule[];

    return allFeatures.map(module => ({ module, enabled: false }));
  }

  async isFeatureEnabled(tenantId: string, feature: FeatureModule): Promise<boolean> {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_module: {
          tenantId,
          module: feature,
        },
      },
    });

    return tenantFeature?.enabled || false;
  }
}