import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FeaturesService } from '../features/features.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/admin.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private featuresService: FeaturesService,
  ) {}

  async getSystemStats() {
    const [totalTenants, totalUsers, activeSubscriptions] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      this.prisma.tenant.count({ where: { active: true } })
    ]);

    // Mock data for licenses (implement when licensing system is ready)
    const expiringLicenses = 0;

    return {
      totalTenants,
      totalUsers,
      activeSubscriptions,
      expiringLicenses
    };
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            routes: true,
            loans: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createTenant(createTenantDto: CreateTenantDto) {
    const { adminUser, ...tenantData } = createTenantDto;

    // Map Spanish field names to English schema names
    const mappedTenantData = {
      name: tenantData.nombre,
      slug: tenantData.slug,
      plan: tenantData.plan as any, // Map to schema enum
      maxUsers: tenantData.maxUsuarios,
      maxClients: tenantData.maxClientes,
      maxRoutes: tenantData.maxRutas,
      active: tenantData.activo ?? true
    };

    // Check if slug is unique
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: mappedTenantData.slug }
    });

    if (existingTenant) {
      throw new BadRequestException('El slug ya está en uso');
    }

    // Create tenant and admin user in transaction
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenant = await tx.tenant.create({
        data: mappedTenantData
      });

      const hashedPassword = await bcrypt.hash(adminUser.password, 10);

      const user = await tx.user.create({
        data: {
          username: adminUser.username,
          email: adminUser.email,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id
        }
      });

      return { tenant, adminUser: { ...user, password: undefined } };
    });

    // Inicializar features después de la transacción
    await this.featuresService.initializeTenantFeatures(result.tenant.id, mappedTenantData.plan);

    return result;
  }

  async updateTenant(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Map Spanish field names to English schema names
    const mappedData: any = {};
    if (updateTenantDto.nombre) mappedData.name = updateTenantDto.nombre;
    if (updateTenantDto.plan) mappedData.plan = updateTenantDto.plan;
    if (updateTenantDto.maxUsuarios) mappedData.maxUsers = updateTenantDto.maxUsuarios;
    if (updateTenantDto.maxClientes) mappedData.maxClients = updateTenantDto.maxClientes;
    if (updateTenantDto.maxRutas) mappedData.maxRoutes = updateTenantDto.maxRutas;
    if (updateTenantDto.activo !== undefined) mappedData.active = updateTenantDto.activo;

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: mappedData
    });

    // Si cambió el plan, reinicializar features
    if (updateTenantDto.plan && updateTenantDto.plan !== tenant.plan) {
      await this.featuresService.initializeTenantFeatures(id, updateTenantDto.plan);
    }

    return updated;
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Delete all related data in transaction
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete users first
      await tx.user.deleteMany({ where: { tenantId: id } });
      
      // Delete tenant
      await tx.tenant.delete({ where: { id } });
    });
  }

  async getTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    });
  }

  async getTenantLimits(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            routes: true
          }
        }
      }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    return {
      usuarios: {
        current: tenant._count.users,
        max: tenant.maxUsers,
        available: tenant.maxUsers - tenant._count.users
      },
      clientes: {
        current: tenant._count.clients,
        max: tenant.maxClients,
        available: tenant.maxClients - tenant._count.clients
      },
      rutas: {
        current: tenant._count.routes,
        max: tenant.maxRoutes,
        available: tenant.maxRoutes - tenant._count.routes
      }
    };
  }

  async initializeFeaturesForAllTenants() {
    const tenants = await this.prisma.tenant.findMany();
    let initialized = 0;

    for (const tenant of tenants) {
      const existing = await this.prisma.tenantFeature.count({ where: { tenantId: tenant.id } });
      if (existing === 0) {
        await this.featuresService.initializeTenantFeatures(tenant.id, tenant.plan);
        initialized++;
      }
    }

    return { message: `Features inicializadas para ${initialized} tenants`, total: tenants.length, initialized };
  }
}