import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import type { LoginDto, AuthResponse } from '@creditflow/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: { username, active: true },
      include: { tenant: { include: { features: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Para SUPER_ADMIN, no validar tenant
    if (user.role !== 'SUPER_ADMIN' && (!user.tenant || !user.tenant.active)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const payload = {
      sub: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        tenantId: user.tenantId,
        username: user.username,
        email: user.email,
        role: user.role as any,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          plan: user.tenant.plan,
        } : undefined,
        enabledFeatures: user.tenant?.features
          ?.filter(f => f.enabled)
          .map(f => f.module) || [],
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: { include: { features: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Auto-inicializar features si el tenant no tiene ninguna
    let features = user.tenant?.features || [];
    if (user.tenant && features.length === 0) {
      const defaultFeatures = this.getDefaultFeaturesForPlan(user.tenant.plan);
      for (const { module, enabled } of defaultFeatures) {
        await this.prisma.tenantFeature.upsert({
          where: { tenantId_module: { tenantId: user.tenant.id, module } },
          update: { enabled },
          create: { tenantId: user.tenant.id, module, enabled },
        });
      }
      features = await this.prisma.tenantFeature.findMany({ where: { tenantId: user.tenant.id } });
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      email: user.email,
      role: user.role as any,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      } : undefined,
      enabledFeatures: features
        .filter(f => f.enabled)
        .map(f => f.module) || [],
    };
  }

  private getDefaultFeaturesForPlan(plan: string) {
    const core = [
      { module: 'CLIENTS_BASIC' as const, enabled: true },
      { module: 'LOANS_BASIC' as const, enabled: true },
      { module: 'PAYMENTS_BASIC' as const, enabled: true },
      { module: 'ROUTES_BASIC' as const, enabled: true },
    ];
    const advanced = [
      { module: 'EXPENSES' as const, enabled: plan !== 'BASIC' },
      { module: 'REPORTS_ADVANCED' as const, enabled: false },
      { module: 'USERS_MANAGEMENT' as const, enabled: plan !== 'BASIC' },
      { module: 'API_REST' as const, enabled: false },
      { module: 'EXPORT_EXCEL' as const, enabled: false },
      { module: 'CONCEPTS_CUSTOM' as const, enabled: plan !== 'BASIC' },
      { module: 'REFINANCING' as const, enabled: plan !== 'BASIC' },
    ];
    const enterprise = [
      { module: 'WHITE_LABEL' as const, enabled: false },
      { module: 'CUSTOM_DOMAIN' as const, enabled: false },
      { module: 'WEBHOOKS' as const, enabled: false },
      { module: 'SSO' as const, enabled: false },
      { module: 'AUDIT_LOGS' as const, enabled: plan === 'ENTERPRISE' },
      { module: 'CUSTOM_REPORTS' as const, enabled: false },
      { module: 'ROLES_PERMISSIONS' as const, enabled: plan === 'ENTERPRISE' },
    ];
    return [...core, ...advanced, ...enterprise];
  }
}
