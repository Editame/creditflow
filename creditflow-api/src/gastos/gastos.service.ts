import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateGastoDto, FilterGastoDto } from '@creditflow/shared-types';

@Injectable()
export class GastosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createGastoDto: CreateGastoDto) {
    const ruta = await this.prisma.ruta.findFirst({
      where: { id: createGastoDto.rutaId, tenantId },
    });

    if (!ruta) {
      throw new NotFoundException('Ruta not found');
    }

    return this.prisma.gasto.create({
      data: {
        tenantId,
        rutaId: createGastoDto.rutaId,
        monto: createGastoDto.monto,
        descripcion: createGastoDto.descripcion,
        categoria: createGastoDto.categoria,
        fecha: createGastoDto.fecha ? new Date(createGastoDto.fecha) : new Date(),
      },
    });
  }

  async findAll(tenantId: string, filters: FilterGastoDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.rutaId) where.rutaId = filters.rutaId;
    if (filters.categoria) where.categoria = filters.categoria;

    const [data, total] = await Promise.all([
      this.prisma.gasto.findMany({
        where,
        skip,
        take,
        include: { ruta: true },
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.gasto.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async remove(tenantId: string, id: number) {
    const gasto = await this.prisma.gasto.findFirst({
      where: { id, tenantId },
    });

    if (!gasto) {
      throw new NotFoundException('Gasto not found');
    }

    return this.prisma.gasto.delete({
      where: { id },
    });
  }
}
