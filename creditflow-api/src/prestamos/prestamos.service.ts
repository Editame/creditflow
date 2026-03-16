import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import { PaymentFrequency, LoanStatus } from '@creditflow/shared-types';
import type { CreateLoanDto, FilterPrestamoDto, RefinanceLoanDto } from '@creditflow/shared-types';
import { ChargeConceptsService } from '../charge-concepts/charge-concepts.service';
import { addDaysToDate, calculatePeriodsElapsed } from '../common/helpers/date.helper';

@Injectable()
export class PrestamosService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChargeConceptsService))
    private chargeConceptsService: ChargeConceptsService,
  ) {}

  async create(tenantId: string, createPrestamoDto: CreateLoanDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: createPrestamoDto.clientId, tenantId, active: true },
    });

    if (!client) throw new NotFoundException('Client not found or inactive');

    let totalDiscounts = 0;
    let discountsCalculated: Array<{ conceptId: number; discountAmount: number; percentage: number }> = [];

    if (createPrestamoDto.discountConcepts && createPrestamoDto.discountConcepts.length > 0) {
      const result = await this.chargeConceptsService.calculateDiscounts(tenantId, createPrestamoDto.loanAmount, createPrestamoDto.discountConcepts);
      totalDiscounts = result.totalDiscounts;
      discountsCalculated = result.calculatedDiscounts;
    }

    let totalCosts = 0;
    let costsCalculated: Array<{ conceptId: number; costAmount: number; percentage: number }> = [];

    if (createPrestamoDto.costConcepts && createPrestamoDto.costConcepts.length > 0) {
      const result = await this.chargeConceptsService.calculateCosts(tenantId, createPrestamoDto.loanAmount, createPrestamoDto.costConcepts);
      totalCosts = result.totalCosts;
      costsCalculated = result.calculatedCosts;
    }

    const receivedAmount = createPrestamoDto.loanAmount - totalDiscounts;
    const disbursedAmount = receivedAmount + totalCosts;
    const totalWithInterest = createPrestamoDto.loanAmount * (1 + createPrestamoDto.interestRate / 100);

    const disbursementDate = new Date(createPrestamoDto.disbursementDate);
    const collectionStartDate = createPrestamoDto.collectionStartDate ? new Date(createPrestamoDto.collectionStartDate) : new Date(disbursementDate.getTime() + 24 * 60 * 60 * 1000);

    let endDate: Date;
    let installmentValue: number;

    if (createPrestamoDto.endDate) {
      endDate = new Date(createPrestamoDto.endDate);
      const periods = this.calculatePeriodsBetweenDates(collectionStartDate, endDate, createPrestamoDto.paymentFrequency);
      installmentValue = periods > 0 ? Math.ceil(totalWithInterest / periods) : totalWithInterest;
    } else if (createPrestamoDto.installmentValue) {
      installmentValue = createPrestamoDto.installmentValue;
      const numInstallments = Math.ceil(totalWithInterest / installmentValue);
      endDate = this.calculateEndDate(collectionStartDate, numInstallments, createPrestamoDto.paymentFrequency);
    } else {
      const periods = createPrestamoDto.paymentFrequency === PaymentFrequency.DAILY ? 30 : 4;
      installmentValue = Math.ceil(totalWithInterest / periods);
      endDate = this.calculateEndDate(collectionStartDate, periods, createPrestamoDto.paymentFrequency);
    }

    return this.prisma.loan.create({
      data: {
        tenantId,
        clientId: createPrestamoDto.clientId,
        loanAmount: createPrestamoDto.loanAmount,
        receivedAmount,
        totalDiscounts,
        totalCosts,
        disbursedAmount,
        interestRate: createPrestamoDto.interestRate,
        paymentFrequency: createPrestamoDto.paymentFrequency,
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
  }

  async findAll(tenantId: string, filters: FilterPrestamoDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.clienteId) where.clientId = filters.clienteId;
    if (filters.estado) where.status = filters.estado;

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

  private calculateEndDate(startDate: Date, numPayments: number, frequency: PaymentFrequency): Date {
    const daysToAdd = frequency === PaymentFrequency.DAILY ? numPayments : numPayments * 7;
    return addDaysToDate(startDate, daysToAdd);
  }

  private calculatePeriodsBetweenDates(startDate: Date, endDate: Date, frequency: PaymentFrequency): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return frequency === PaymentFrequency.DAILY ? Math.max(1, diffDays) : Math.max(1, Math.ceil(diffDays / 7));
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
      const periods = this.calculatePeriodsBetweenDates(collectionStartDate, endDate, refinanceDto.paymentFrequency);
      installmentValue = periods > 0 ? Math.ceil(totalWithInterest / periods) : totalWithInterest;
    } else if (refinanceDto.installmentValue) {
      installmentValue = refinanceDto.installmentValue;
      const numInstallments = Math.ceil(totalWithInterest / installmentValue);
      endDate = this.calculateEndDate(collectionStartDate, numInstallments, refinanceDto.paymentFrequency);
    } else {
      const periods = refinanceDto.paymentFrequency === PaymentFrequency.DAILY ? 30 : 4;
      installmentValue = Math.ceil(totalWithInterest / periods);
      endDate = this.calculateEndDate(collectionStartDate, periods, refinanceDto.paymentFrequency);
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
          paymentFrequency: refinanceDto.paymentFrequency,
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
