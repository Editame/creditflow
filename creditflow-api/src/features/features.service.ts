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

  private getDefaultFeaturesForPlan(plan: string): Array<{ module: FeatureModule; enabled: boolean }> {
    const coreFeatures = [
      { module: 'CLIENTS_BASIC' as FeatureModule, enabled: true },
      { module: 'LOANS_BASIC' as FeatureModule, enabled: true },
      { module: 'PAYMENTS_BASIC' as FeatureModule, enabled: true },
      { module: 'ROUTES_BASIC' as FeatureModule, enabled: true },
    ];

    const advancedFeatures = [
      { module: 'EXPENSES' as FeatureModule, enabled: plan !== 'BASIC' },
      { module: 'REPORTS_ADVANCED' as FeatureModule, enabled: false }, // Premium feature
      { module: 'USERS_MANAGEMENT' as FeatureModule, enabled: plan !== 'BASIC' },
      { module: 'API_REST' as FeatureModule, enabled: false }, // Premium feature
      { module: 'EXPORT_EXCEL' as FeatureModule, enabled: false }, // Premium feature
      { module: 'CONCEPTS_CUSTOM' as FeatureModule, enabled: plan !== 'BASIC' },
      { module: 'REFINANCING' as FeatureModule, enabled: plan !== 'BASIC' },
    ];

    const enterpriseFeatures = [
      { module: 'WHITE_LABEL' as FeatureModule, enabled: false }, // Premium feature
      { module: 'CUSTOM_DOMAIN' as FeatureModule, enabled: false }, // Premium feature
      { module: 'WEBHOOKS' as FeatureModule, enabled: false }, // Premium feature
      { module: 'SSO' as FeatureModule, enabled: false }, // Premium feature
      { module: 'AUDIT_LOGS' as FeatureModule, enabled: plan === 'ENTERPRISE' },
      { module: 'CUSTOM_REPORTS' as FeatureModule, enabled: false }, // Premium feature
      { module: 'ROLES_PERMISSIONS' as FeatureModule, enabled: plan === 'ENTERPRISE' },
    ];

    return [...coreFeatures, ...advancedFeatures, ...enterpriseFeatures];
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