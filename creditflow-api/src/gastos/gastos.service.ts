import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateExpenseDto, FilterExpenseDto } from '@creditflow/shared-types';

@Injectable()
export class GastosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createExpenseDto: CreateExpenseDto) {
    const ruta = await this.prisma.route.findFirst({
      where: { id: createExpenseDto.routeId, tenantId },
    });

    if (!ruta) {
      throw new NotFoundException('Route not found');
    }

    return this.prisma.expense.create({
      data: {
        tenantId,
        routeId: createExpenseDto.routeId,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        category: createExpenseDto.category,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
      },
    });
  }

  async findAll(tenantId: string, filters: FilterExpenseDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.category) where.category = filters.category;

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
