import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateRutaDto, UpdateRutaDto, PaginationParams } from '@creditflow/shared-types';

@Injectable()
export class RutasService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createRutaDto: CreateRutaDto) {
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
