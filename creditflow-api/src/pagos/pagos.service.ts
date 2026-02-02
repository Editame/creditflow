import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import { LoanStatus } from '@creditflow/shared-types';
import type { CreatePaymentDto, FilterPagoDto } from '@creditflow/shared-types';
import { getTodayRangeInTimezone, getDateRangeInTimezone, getTodayString, getTodayInTimezone, aplicaCobroHoy, calculatePeriodsElapsed } from '../common/helpers/date.helper';
import { calculateLoanEndDate, calculateRemainingQuotas } from '../common/helpers/loan.helper';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: number, createPagoDto: CreatePaymentDto) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: createPagoDto.loanId, tenantId },
      include: { client: true },
    });

    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status === LoanStatus.PAID) throw new BadRequestException('Loan is already fully paid');

    const pendingBalance = Number(loan.pendingBalance);
    const installmentValue = Number(loan.installmentValue);
    const paymentAmount = createPagoDto.paidAmount;

    if (paymentAmount === 0 && !createPagoDto.notes?.trim()) {
      throw new BadRequestException('Notes required when payment is 0');
    }

    if (paymentAmount > pendingBalance) {
      throw new BadRequestException('Payment exceeds pending balance');
    }

    if (installmentValue <= 0) {
      throw new BadRequestException('Invalid loan configuration: installmentValue must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          loanId: createPagoDto.loanId,
          collectorId: userId,
          routeId: loan.client.routeId,
          paidAmount: paymentAmount,
          paidBy: createPagoDto.paidBy || 'CLIENTE',
          notes: createPagoDto.notes,
        },
      });

      const newBalance = pendingBalance - paymentAmount;
      let newStatus: LoanStatus = loan.status;
      let newEndDate = loan.endDate;

      if (newBalance <= 0) {
        newStatus = LoanStatus.PAID;
      } else {
        const totalPaid = await tx.payment.aggregate({
          where: { loanId: createPagoDto.loanId },
          _sum: { amountPaid: true },
        });

        const paid = totalPaid._sum.amountPaid?.toNumber() || 0;
        const fullQuotasPaid = Math.floor(paid / installmentValue);
        const periodsElapsed = calculatePeriodsElapsed(loan.collectionStartDate, loan.paymentFrequency);

        if (newBalance > 0) {
          const remainingQuotas = calculateRemainingQuotas(newBalance, installmentValue);
          newEndDate = calculateLoanEndDate(getTodayInTimezone(), remainingQuotas, loan.paymentFrequency);
        }

        newStatus = fullQuotasPaid < periodsElapsed ? LoanStatus.OVERDUE : LoanStatus.ACTIVE;
      }

      await tx.loan.update({
        where: { id: createPagoDto.loanId },
        data: { pendingBalance: newBalance, status: newStatus, endDate: newEndDate },
      });

      return payment;
    });
  }

  async findAll(tenantId: string, filters: FilterPagoDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.rutaId) where.routeId = filters.rutaId;
    if (filters.fecha) {
      const { start, end } = getDateRangeInTimezone(filters.fecha);
      where.paymentDate = { gte: start, lt: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          loan: { include: { client: true } },
          collector: true,
          route: true,
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async getTodayCollectionsSummary(tenantId: string, routeId?: number) {
    const { start, end } = getTodayRangeInTimezone();

    const where: any = { tenantId, paymentDate: { gte: start, lt: end } };
    if (routeId) where.routeId = routeId;

    const collections = await this.prisma.payment.aggregate({
      where,
      _sum: { amountPaid: true },
      _count: true,
    });

    const activeLoans = await this.prisma.loan.findMany({
      where: {
        tenantId,
        status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
        ...(routeId && { client: { routeId } }),
      },
      include: { client: true },
    });

    const expectedToday = activeLoans.reduce((sum, loan) => {
      if (aplicaCobroHoy(loan.collectionStartDate, loan.paymentFrequency)) {
        return sum + Number(loan.installmentValue);
      }
      return sum;
    }, 0);

    const collected = collections._sum.amountPaid?.toNumber() || 0;

    return {
      date: getTodayString(),
      totalCollected: collected,
      paymentCount: collections._count,
      expectedToday,
      compliancePercentage: expectedToday > 0 ? (collected / expectedToday) * 100 : 0,
    };
  }
}
