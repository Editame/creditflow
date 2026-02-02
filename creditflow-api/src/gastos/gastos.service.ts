import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateGastoDto, FilterGastoDto } from '@creditflow/shared-types';

@Injectable()
export class GastosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createGastoDto: CreateGastoDto) {
    const ruta = await this.prisma.route.findFirst({
      where: { id: createGastoDto.routeId, tenantId },
    });

    if (!ruta) {
      throw new NotFoundException('Route not found');
    }

    return this.prisma.expense.create({
      data: {
        tenantId,
        routeId: createGastoDto.routeId,
        amount: createGastoDto.amount,
        description: createGastoDto.description,
        category: createGastoDto.category,
        date: createGastoDto.date ? new Date(createGastoDto.date) : new Date(),
      },
    });
  }

  async findAll(tenantId: string, filters: FilterGastoDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.rutaId) where.routeId = filters.rutaId;
    if (filters.categoria) where.category = filters.categoria;

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        include: { route: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async remove(tenantId: string, id: number) {
    const gasto = await this.prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!gasto) {
      throw new NotFoundException('Expense not found');
    }

    return this.prisma.expense.delete({
      where: { id },
    });
  }
}
