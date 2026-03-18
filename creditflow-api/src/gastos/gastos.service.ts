import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateExpenseDto, FilterExpenseDto } from '@creditflow/shared-types';
import { CashService } from '../cash/cash.service';

@Injectable()
export class GastosService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CashService))
    private cashService: CashService,
  ) {}

  async create(tenantId: string, createExpenseDto: CreateExpenseDto) {
    const ruta = await this.prisma.route.findFirst({
      where: { id: createExpenseDto.routeId, tenantId },
    });

    if (!ruta) {
      throw new NotFoundException('Route not found');
    }

    const expense = await this.prisma.expense.create({
      data: {
        tenantId,
        routeId: createExpenseDto.routeId,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        category: createExpenseDto.category,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
      },
    });

    // Auto-movement: cash out
    try {
      await this.cashService.recordExpense(tenantId, expense.id, createExpenseDto.amount, createExpenseDto.routeId);
    } catch (e) { /* no cash register yet */ }

    return expense;
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
