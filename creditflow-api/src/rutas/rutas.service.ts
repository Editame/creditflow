import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateRutaDto, UpdateRutaDto, PaginationParams } from '@creditflow/shared-types';

@Injectable()
export class RutasService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createRutaDto: CreateRutaDto) {
    return this.prisma.ruta.create({
      data: {
        ...createRutaDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, pagination: PaginationParams) {
    const { skip, take } = getPaginationParams(pagination);

    const [data, total] = await Promise.all([
      this.prisma.ruta.findMany({
        where: { tenantId },
        skip,
        take,
        include: {
          _count: {
            select: { clientes: true, pagos: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ruta.count({ where: { tenantId } }),
    ]);

    return createPaginatedResponse(data, total, pagination);
  }

  async findOne(tenantId: string, id: number) {
    const ruta = await this.prisma.ruta.findFirst({
      where: { id, tenantId },
      include: {
        clientes: true,
        presupuestos: true,
        gastos: true,
      },
    });

    if (!ruta) {
      throw new NotFoundException(`Ruta with ID ${id} not found`);
    }

    return ruta;
  }

  async update(tenantId: string, id: number, updateRutaDto: UpdateRutaDto) {
    await this.findOne(tenantId, id);
    return this.prisma.ruta.update({
      where: { id },
      data: updateRutaDto,
    });
  }

  async remove(tenantId: string, id: number) {
    await this.findOne(tenantId, id);
    return this.prisma.ruta.delete({
      where: { id },
    });
  }
}
