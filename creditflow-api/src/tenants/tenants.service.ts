import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CreateTenantDto, UpdateTenantDto } from '@creditflow/shared-types';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        plan: createTenantDto.plan,
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            loans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        features: true,
        _count: {
          select: {
            users: true,
            clients: true,
            loans: true,
            routes: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { features: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async checkLimits(tenantId: string) {
    const tenant = await this.findOne(tenantId);
    const counts = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        _count: {
          select: {
            users: true,
            clients: true,
            routes: true,
          },
        },
      },
    });

    return {
      users: {
        current: counts?._count.users || 0,
        max: tenant.maxUsers,
        available: tenant.maxUsers - (counts?._count.users || 0),
      },
      clients: {
        current: counts?._count.clients || 0,
        max: tenant.maxClients,
        available: tenant.maxClients - (counts?._count.clients || 0),
      },
      routes: {
        current: counts?._count.routes || 0,
        max: tenant.maxRoutes,
        available: tenant.maxRoutes - (counts?._count.routes || 0),
      },
    };
  }
}
