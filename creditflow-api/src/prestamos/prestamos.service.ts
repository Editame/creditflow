import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import { PaymentFrequency, LoanStatus } from '@creditflow/shared-types';
import type { CreateLoanDto, FilterLoanDto, RefinanceLoanDto } from '@creditflow/shared-types';
import { ChargeConceptsService } from '../charge-concepts/charge-concepts.service';
import { CashService } from '../cash/cash.service';
import { addDaysToDate, calculatePeriodsElapsed } from '../common/helpers/date.helper';

@Injectable()
export class PrestamosService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChargeConceptsService))
    private chargeConceptsService: ChargeConceptsService,
    @Inject(forwardRef(() => CashService))
    private cashService: CashService,
  ) {}

  async create(tenantId: string, createLoanDto: CreateLoanDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: createLoanDto.clientId, tenantId, active: true },
    });

    if (!client) throw new NotFoundException('Client not found or inactive');

    let totalDiscounts = 0;
    let discountsCalculated: Array<{ conceptId: number; discountAmount: number; percentage: number }> = [];

    if (createLoanDto.discountConcepts && createLoanDto.discountConcepts.length > 0) {
      const result = await this.chargeConceptsService.calculateDiscounts(tenantId, createLoanDto.loanAmount, createLoanDto.discountConcepts);
      totalDiscounts = result.totalDiscounts;
      discountsCalculated = result.calculatedDiscounts;
    }

    let totalCosts = 0;
    let costsCalculated: Array<{ conceptId: number; costAmount: number; percentage: number }> = [];

    if (createLoanDto.costConcepts && createLoanDto.costConcepts.length > 0) {
      const result = await this.chargeConceptsService.calculateCosts(tenantId, createLoanDto.loanAmount, createLoanDto.costConcepts);
      totalCosts = result.totalCosts;
      costsCalculated = result.calculatedCosts;
    }

    const receivedAmount = createLoanDto.loanAmount - totalDiscounts;
    const disbursedAmount = receivedAmount + totalCosts;
    const totalWithInterest = createLoanDto.loanAmount * (1 + createLoanDto.interestRate / 100);

    const disbursementDate = new Date(createLoanDto.disbursementDate);
    const collectionStartDate = createLoanDto.collectionStartDate ? new Date(createLoanDto.collectionStartDate) : new Date(disbursementDate.getTime() + 24 * 60 * 60 * 1000);

    let endDate: Date;
    let installmentValue: number;

    if (createLoanDto.endDate) {
      endDate = new Date(createLoanDto.endDate);
      const periods = this.calculatePeriodsBetweenDates(collectionStartDate, endDate, createLoanDto.paymentFrequency as PaymentFrequency);
      installmentValue = periods > 0 ? Math.ceil(totalWithInterest / periods) : totalWithInterest;
    } else if (createLoanDto.installmentValue) {
      installmentValue = createLoanDto.installmentValue;
      const numInstallments = Math.ceil(totalWithInterest / installmentValue);
      endDate = this.calculateEndDate(collectionStartDate, numInstallments, createLoanDto.paymentFrequency as PaymentFrequency);
    } else {
      const periods = this.getDefaultPeriods(createLoanDto.paymentFrequency as PaymentFrequency);
      installmentValue = Math.ceil(totalWithInterest / periods);
      endDate = this.calculateEndDate(collectionStartDate, periods, createLoanDto.paymentFrequency as PaymentFrequency);
    }

    const loan = await this.prisma.loan.create({
      data: {
        tenantId,
        clientId: createLoanDto.clientId,
        loanAmount: createLoanDto.loanAmount,
        receivedAmount,
        totalDiscounts,
        totalCosts,
        disbursedAmount,
        interestRate: createLoanDto.interestRate,
        paymentFrequency: createLoanDto.paymentFrequency as PaymentFrequency,
        installmentValue,
        pendingBalance: totalWithInterest,
        disbursementDate,
        collectionStartDate,
        endDate,
        originalEndDate: endDate,
        status: LoanStatus.ACTIVE,
        discounts: discountsCalculated.length > 0 ? { create: discountsCalculated } : undefined,
        costs: costsCalculated.length > 0 ? { create: costsCalculated } : undefined,
      },
      include: {
        client: true,
        discounts: { include: { concept: true } },
        costs: { include: { concept: true } },
      },
    });

    // Auto-movement: cash out
    try {
      const client = await this.prisma.client.findUnique({ where: { id: createLoanDto.clientId }, select: { routeId: true } });
      if (client) {
        await this.cashService.recordLoanDisbursement(tenantId, loan.id, disbursedAmount, client.routeId);
      }
    } catch (e) { /* no cash register yet — skip */ }

    return loan;
  }

  async findAll(tenantId: string, filters: FilterLoanDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.clientId) where.clientId = Number(filters.clientId);
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take,
        include: {
          client: {
            include: { route: true },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loan.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async findOne(tenantId: string, id: number) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, tenantId },
      include: {
        client: { include: { route: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        discounts: { include: { concept: true } },
        costs: { include: { concept: true } },
      },
    });

    if (!loan) throw new NotFoundException('Loan not found');

    const loanAmount = Number(loan.loanAmount);
    const interestRate = Number(loan.interestRate);
    const totalAmount = loanAmount * (1 + interestRate / 100);

    return { ...loan, totalAmount };
  }

  async getLoanStatus(tenantId: string, id: number) {
    const loan = await this.findOne(tenantId, id);

    const totalPaid = await this.prisma.payment.aggregate({
      where: { loanId: id },
      _sum: { amountPaid: true },
    });

    const paid = totalPaid._sum.amountPaid?.toNumber() || 0;
    const installmentValue = Number(loan.installmentValue);
    const pendingBalance = Number(loan.pendingBalance);
    const loanAmount = Number(loan.loanAmount);
    const interestRate = Number(loan.interestRate);
    const totalAmount = loanAmount * (1 + interestRate / 100);

    const installmentsCovered = Math.floor(paid / installmentValue);
    const periodsElapsed = calculatePeriodsElapsed(loan.collectionStartDate, loan.paymentFrequency);

    const isOverdue = installmentsCovered < periodsElapsed;
    const periodsOverdue = isOverdue ? periodsElapsed - installmentsCovered : 0;

    let daysDeviation = 0;
    if (loan.originalEndDate) {
      const originalEnd = new Date(loan.originalEndDate);
      const currentEnd = new Date(loan.endDate);
      daysDeviation = Math.round((currentEnd.getTime() - originalEnd.getTime()) / (1000 * 60 * 60 * 24));
    }

    const remainingInstallments = Math.ceil(pendingBalance / installmentValue);

    return {
      loanId: id,
      clientName: loan.client.fullName,
      totalAmount,
      totalPaid: paid,
      pendingBalance,
      installmentValue,
      paymentFrequency: loan.paymentFrequency,
      collectionStartDate: loan.collectionStartDate,
      originalEndDate: loan.originalEndDate,
      expectedEndDate: loan.endDate,
      daysDeviation,
      remainingInstallments,
      installmentsCovered,
      periodsElapsed,
      isOverdue,
      periodsOverdue,
      status: loan.status,
    };
  }

  async updateLoanStatus(tenantId: string, id: number) {
    const status = await this.getLoanStatus(tenantId, id);

    let newStatus: LoanStatus = LoanStatus.ACTIVE;

    if (status.pendingBalance <= 0) {
      newStatus = LoanStatus.PAID;
    } else if (status.isOverdue) {
      newStatus = LoanStatus.OVERDUE;
    }

    if (newStatus !== status.status) {
      await this.prisma.loan.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return { ...status, status: newStatus };
  }

  async remove(tenantId: string, id: number) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { payments: true } }, client: true },
    });

    if (!loan) throw new NotFoundException('Loan not found');

    if (loan._count.payments > 0) {
      throw new BadRequestException('No se puede eliminar un préstamo que ya tiene pagos registrados');
    }

    await this.prisma.loan.delete({ where: { id } });

    // Revertir movimiento de caja si existe
    try {
      const movement = await this.prisma.cashMovement.findFirst({
        where: { loanId: id },
        include: { cashRegister: true },
      });
      if (movement) {
        const newBalance = Number(movement.cashRegister.balance) + Number(movement.amount);
        await this.prisma.$transaction([
          this.prisma.cashMovement.delete({ where: { id: movement.id } }),
          this.prisma.cashRegister.update({
            where: { id: movement.cashRegisterId },
            data: { balance: newBalance },
          }),
        ]);
      }
    } catch (e) { /* no cash movement */ }

    return { deleted: true };
  }

  private getDefaultPeriods(frequency: PaymentFrequency): number {
    switch (frequency) {
      case PaymentFrequency.DAILY: return 30;
      case PaymentFrequency.WEEKLY: return 4;
      case PaymentFrequency.BIWEEKLY: return 2;
      case PaymentFrequency.MONTHLY: return 1;
      default: return 30;
    }
  }

  private getDaysPerPeriod(frequency: PaymentFrequency): number {
    switch (frequency) {
      case PaymentFrequency.DAILY: return 1;
      case PaymentFrequency.WEEKLY: return 7;
      case PaymentFrequency.BIWEEKLY: return 15;
      case PaymentFrequency.MONTHLY: return 30;
      default: return 1;
    }
  }

  private calculateEndDate(startDate: Date, numPayments: number, frequency: PaymentFrequency): Date {
    return addDaysToDate(startDate, numPayments * this.getDaysPerPeriod(frequency));
  }

  private calculatePeriodsBetweenDates(startDate: Date, endDate: Date, frequency: PaymentFrequency): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / this.getDaysPerPeriod(frequency)));
  }

  async refinance(tenantId: string, loanId: number, refinanceDto: RefinanceLoanDto, userId: number) {
    // Validar préstamo anterior
    const previousLoan = await this.prisma.loan.findFirst({
      where: { id: loanId, tenantId, status: LoanStatus.ACTIVE },
      include: { client: true }
    });

    if (!previousLoan) {
      throw new NotFoundException('Préstamo no encontrado o no está activo');
    }

    const previousPendingBalance = Number(previousLoan.pendingBalance);
    
    // Validar que el nuevo monto sea mayor al saldo pendiente
    if (refinanceDto.newAmount <= previousPendingBalance) {
      throw new BadRequestException('El nuevo monto debe ser mayor al saldo pendiente');
    }

    // Calcular descuentos y costos
    let totalDiscounts = 0;
    let discountsCalculated: Array<{ conceptId: number; discountAmount: number; percentage: number }> = [];

    if (refinanceDto.discountConcepts && refinanceDto.discountConcepts.length > 0) {
      const result = await this.chargeConceptsService.calculateDiscounts(tenantId, refinanceDto.newAmount, refinanceDto.discountConcepts);
      totalDiscounts = result.totalDiscounts;
      discountsCalculated = result.calculatedDiscounts;
    }

    let totalCosts = 0;
    let costsCalculated: Array<{ conceptId: number; costAmount: number; percentage: number }> = [];

    if (refinanceDto.costConcepts && refinanceDto.costConcepts.length > 0) {
      const result = await this.chargeConceptsService.calculateCosts(tenantId, refinanceDto.newAmount, refinanceDto.costConcepts);
      totalCosts = result.totalCosts;
      costsCalculated = result.calculatedCosts;
    }

    const receivedAmount = refinanceDto.newAmount - totalDiscounts;
    const disbursedAmount = receivedAmount + totalCosts;
    const deliveredAmount = receivedAmount - previousPendingBalance;
    const totalWithInterest = refinanceDto.newAmount * (1 + refinanceDto.interestRate / 100);

    const disbursementDate = new Date(refinanceDto.disbursementDate);
    const collectionStartDate = refinanceDto.collectionStartDate ? new Date(refinanceDto.collectionStartDate) : new Date(disbursementDate.getTime() + 24 * 60 * 60 * 1000);

    let endDate: Date;
    let installmentValue: number;

    if (refinanceDto.endDate) {
      endDate = new Date(refinanceDto.endDate);
      const periods = this.calculatePeriodsBetweenDates(collectionStartDate, endDate, refinanceDto.paymentFrequency as PaymentFrequency);
      installmentValue = periods > 0 ? Math.ceil(totalWithInterest / periods) : totalWithInterest;
    } else if (refinanceDto.installmentValue) {
      installmentValue = refinanceDto.installmentValue;
      const numInstallments = Math.ceil(totalWithInterest / installmentValue);
      endDate = this.calculateEndDate(collectionStartDate, numInstallments, refinanceDto.paymentFrequency as PaymentFrequency);
    } else {
      const periods = this.getDefaultPeriods(refinanceDto.paymentFrequency as PaymentFrequency);
      installmentValue = Math.ceil(totalWithInterest / periods);
      endDate = this.calculateEndDate(collectionStartDate, periods, refinanceDto.paymentFrequency as PaymentFrequency);
    }

    // Transacción para refinanciamiento
    return this.prisma.$transaction(async (tx) => {
      // Marcar préstamo anterior como PAID
      await tx.loan.update({
        where: { id: loanId },
        data: { status: LoanStatus.PAID }
      });

      // Crear nuevo préstamo
      const newLoan = await tx.loan.create({
        data: {
          tenantId,
          clientId: previousLoan.clientId,
          loanAmount: refinanceDto.newAmount,
          receivedAmount,
          totalDiscounts,
          totalCosts,
          disbursedAmount,
          interestRate: refinanceDto.interestRate,
          paymentFrequency: refinanceDto.paymentFrequency as PaymentFrequency,
          installmentValue,
          pendingBalance: totalWithInterest,
          disbursementDate,
          collectionStartDate,
          endDate,
          originalEndDate: endDate,
          status: LoanStatus.ACTIVE,
          createdById: userId,
          discounts: discountsCalculated.length > 0 ? { create: discountsCalculated } : undefined,
          costs: costsCalculated.length > 0 ? { create: costsCalculated } : undefined,
        },
        include: {
          client: true,
          discounts: { include: { concept: true } },
          costs: { include: { concept: true } },
        },
      });

      // Crear registro de refinanciamiento
      await tx.refinancing.create({
        data: {
          tenantId,
          previousLoanId: loanId,
          newLoanId: newLoan.id,
          previousPendingBalance,
          newAmount: refinanceDto.newAmount,
          deliveredAmount,
          refinancingReason: refinanceDto.refinancingReason,
          createdById: userId,
        },
      });

      return {
        ...newLoan,
        deliveredAmount,
        previousLoan: {
          id: previousLoan.id,
          pendingBalance: previousPendingBalance,
        },
      };
    });
  }
}
