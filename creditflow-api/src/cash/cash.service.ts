import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import { CashMovementType, Plan } from '@prisma/client';
import type { CreateCashRegisterDto, CreateCashMovementConceptDto, CreateCashMovementDto, FilterCashMovementDto } from '@creditflow/shared-types';
import { getDateRangeInTimezone, getTodayRangeInTimezone } from '../common/helpers/date.helper';

// System concept names (auto-created per tenant)
const SYSTEM_CONCEPTS = [
  { name: 'Préstamo desembolsado', type: CashMovementType.OUT },
  { name: 'Pago recibido', type: CashMovementType.IN },
  { name: 'Gasto operativo', type: CashMovementType.OUT },
];

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CASH REGISTERS
  // ==========================================

  async createRegister(tenantId: string, dto: CreateCashRegisterDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (dto.routeId && tenant?.plan === Plan.BASIC) {
      throw new ForbiddenException('El plan Básico solo permite caja global. Actualiza tu plan para cajas por ruta.');
    }

    if (dto.routeId) {
      const route = await this.prisma.route.findFirst({
        where: { id: dto.routeId, tenantId },
      });
      if (!route) throw new NotFoundException('Ruta no encontrada');
    }

    const existing = await this.prisma.cashRegister.findFirst({
      where: { tenantId, routeId: dto.routeId ?? null },
    });
    if (existing) throw new BadRequestException('Ya existe una caja para esta configuración');

    return this.prisma.cashRegister.create({
      data: {
        tenantId,
        routeId: dto.routeId ?? null,
        name: dto.name,
      },
      include: { route: true },
    });
  }

  async getRegisters(tenantId: string) {
    return this.prisma.cashRegister.findMany({
      where: { tenantId, active: true },
      include: { route: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRegisterSummary(tenantId: string, registerId: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: registerId, tenantId },
      include: { route: true },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');

    const { start, end } = getTodayRangeInTimezone();

    const todayMovements = await this.prisma.cashMovement.groupBy({
      by: ['type'],
      where: { cashRegisterId: registerId, date: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: true,
    });

    const todayIn = todayMovements.find(m => m.type === 'IN')?._sum.amount?.toNumber() || 0;
    const todayOut = todayMovements.find(m => m.type === 'OUT')?._sum.amount?.toNumber() || 0;
    const todayCount = todayMovements.reduce((sum, m) => sum + m._count, 0);

    return {
      ...register,
      balance: Number(register.balance),
      today: {
        in: todayIn,
        out: todayOut,
        net: todayIn - todayOut,
        movements: todayCount,
      },
    };
  }

  // ==========================================
  // MOVEMENT CONCEPTS
  // ==========================================

  async ensureSystemConcepts(tenantId: string) {
    for (const sc of SYSTEM_CONCEPTS) {
      await this.prisma.cashMovementConcept.upsert({
        where: { id: 0 }, // force create path
        update: {},
        create: { tenantId, name: sc.name, type: sc.type, isSystem: true },
      }).catch(async () => {
        const exists = await this.prisma.cashMovementConcept.findFirst({
          where: { tenantId, name: sc.name, isSystem: true },
        });
        if (!exists) {
          await this.prisma.cashMovementConcept.create({
            data: { tenantId, name: sc.name, type: sc.type, isSystem: true },
          });
        }
      });
    }
  }

  async getSystemConceptId(tenantId: string, name: string): Promise<number | null> {
    const concept = await this.prisma.cashMovementConcept.findFirst({
      where: { tenantId, name, isSystem: true },
    });
    return concept?.id ?? null;
  }

  async getConcepts(tenantId: string) {
    await this.ensureSystemConcepts(tenantId);
    return this.prisma.cashMovementConcept.findMany({
      where: { tenantId, active: true },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async createConcept(tenantId: string, dto: CreateCashMovementConceptDto) {
    return this.prisma.cashMovementConcept.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type as CashMovementType,
        description: dto.description,
        isSystem: false,
      },
    });
  }

  // ==========================================
  // MOVEMENTS
  // ==========================================

  async createMovement(tenantId: string, dto: CreateCashMovementDto, userId?: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: dto.cashRegisterId, tenantId, active: true },
    });
    if (!register) throw new NotFoundException('Caja no encontrada');

    const concept = await this.prisma.cashMovementConcept.findFirst({
      where: { id: dto.conceptId, tenantId, active: true },
    });
    if (!concept) throw new NotFoundException('Concepto no encontrado');

    const currentBalance = Number(register.balance);
    const balanceAfter = concept.type === CashMovementType.IN
      ? currentBalance + dto.amount
      : currentBalance - dto.amount;

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.cashMovement.create({
        data: {
          cashRegisterId: dto.cashRegisterId,
          conceptId: dto.conceptId,
          type: concept.type,
          amount: dto.amount,
          balanceAfter,
          description: dto.description,
          createdById: userId,
        },
      });

      await tx.cashRegister.update({
        where: { id: dto.cashRegisterId },
        data: { balance: balanceAfter },
      });

      return { ...movement, balanceAfter };
    });
  }

  async getMovements(tenantId: string, filters: FilterCashMovementDto) {
    const { skip, take } = getPaginationParams(filters);

    const where: any = {};

    if (filters.cashRegisterId) {
      where.cashRegisterId = Number(filters.cashRegisterId);
    } else {
      where.cashRegister = { tenantId };
    }

    if (filters.type) where.type = filters.type;

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        const { start } = getDateRangeInTimezone(filters.dateFrom);
        where.date.gte = start;
      }
      if (filters.dateTo) {
        const { end } = getDateRangeInTimezone(filters.dateTo);
        where.date.lt = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.cashMovement.findMany({
        where,
        skip,
        take,
        include: {
          concept: true,
          cashRegister: { select: { name: true, routeId: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.cashMovement.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  // ==========================================
  // AUTO-MOVEMENTS (called from other services)
  // ==========================================

  async recordLoanDisbursement(tenantId: string, loanId: number, amount: number, routeId: number, userId?: number) {
    const register = await this.findRegisterForRoute(tenantId, routeId);
    if (!register) return;

    const conceptId = await this.getSystemConceptId(tenantId, 'Préstamo desembolsado');
    if (!conceptId) return;

    const balanceAfter = Number(register.balance) - amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          conceptId,
          type: CashMovementType.OUT,
          amount,
          balanceAfter,
          description: `Desembolso préstamo #${loanId}`,
          loanId,
          createdById: userId,
        },
      });
      await tx.cashRegister.update({
        where: { id: register.id },
        data: { balance: balanceAfter },
      });
    });
  }

  async recordPaymentReceived(tenantId: string, paymentId: number, loanId: number, amount: number, routeId: number, userId?: number) {
    if (amount <= 0) return;

    const register = await this.findRegisterForRoute(tenantId, routeId);
    if (!register) return;

    const conceptId = await this.getSystemConceptId(tenantId, 'Pago recibido');
    if (!conceptId) return;

    const balanceAfter = Number(register.balance) + amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          conceptId,
          type: CashMovementType.IN,
          amount,
          balanceAfter,
          description: `Pago #${paymentId} - Préstamo #${loanId}`,
          paymentId,
          createdById: userId,
        },
      });
      await tx.cashRegister.update({
        where: { id: register.id },
        data: { balance: balanceAfter },
      });
    });
  }

  async recordExpense(tenantId: string, expenseId: number, amount: number, routeId: number, userId?: number) {
    const register = await this.findRegisterForRoute(tenantId, routeId);
    if (!register) return;

    const conceptId = await this.getSystemConceptId(tenantId, 'Gasto operativo');
    if (!conceptId) return;

    const balanceAfter = Number(register.balance) - amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          conceptId,
          type: CashMovementType.OUT,
          amount,
          balanceAfter,
          description: `Gasto #${expenseId}`,
          expenseId,
          createdById: userId,
        },
      });
      await tx.cashRegister.update({
        where: { id: register.id },
        data: { balance: balanceAfter },
      });
    });
  }

  // Try route-specific register first, fallback to global
  private async findRegisterForRoute(tenantId: string, routeId: number) {
    let register = await this.prisma.cashRegister.findFirst({
      where: { tenantId, routeId: routeId },
    });

    if (!register) {
      register = await this.prisma.cashRegister.findFirst({
        where: { tenantId, routeId: null },
      });
    }

    return register;
  }
}
