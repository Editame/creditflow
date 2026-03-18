import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateRutaDto, UpdateRutaDto, PaginationParams } from '@creditflow/shared-types';

@Injectable()
export class RutasService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createRutaDto: CreateRutaDto) {
    // Validar límites del tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxRoutes: true, name: true }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Contar rutas actuales del tenant
    const currentRouteCount = await this.prisma.route.count({
      where: { tenantId, active: true }
    });

    if (currentRouteCount >= tenant.maxRoutes) {
      throw new ForbiddenException(
        `Maximum routes limit reached. Your plan allows ${tenant.maxRoutes} routes and you currently have ${currentRouteCount}. Please upgrade your plan to create more routes.`
      );
    }

    return this.prisma.route.create({
      data: {
        tenantId,
        name: createRutaDto.name,
        description: createRutaDto.description,
      },
    });
  }

  async findAll(tenantId: string, pagination: PaginationParams) {
    const { skip, take } = getPaginationParams(pagination);

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where: { tenantId },
        skip,
        take,
        include: {
          _count: {
            select: { clients: true, payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.route.count({ where: { tenantId } }),
    ]);

    return createPaginatedResponse(data, total, pagination);
  }

  async findOne(tenantId: string, id: number) {
    const ruta = await this.prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        clients: true,
        budgets: true,
        expenses: true,
      },
    });

    if (!ruta) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return ruta;
  }

  async update(tenantId: string, id: number, updateRutaDto: UpdateRutaDto) {
    await this.findOne(tenantId, id);
    return this.prisma.route.update({
      where: { id },
      data: {
        ...(updateRutaDto.name && { name: updateRutaDto.name }),
        ...(updateRutaDto.description && { description: updateRutaDto.description }),
        ...(updateRutaDto.active !== undefined && { active: updateRutaDto.active }),
      },
    });
  }

  async remove(tenantId: string, id: number) {
    await this.findOne(tenantId, id);
    return this.prisma.route.delete({
      where: { id },
    });
  }
}
