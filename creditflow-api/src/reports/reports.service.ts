import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getLiquidation(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const collected = await this.prisma.payment.aggregate({
      where: { tenantId, paymentDate: { gte: start, lte: end } },
      _sum: { amountPaid: true },
      _count: true,
    });

    const lent = await this.prisma.loan.aggregate({
      where: { tenantId, disbursementDate: { gte: start, lte: end } },
      _sum: { loanAmount: true, totalDiscounts: true, totalCosts: true },
      _count: true,
    });

    const expenses = await this.prisma.expense.aggregate({
      where: { tenantId, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    });

    const newLoans = await this.prisma.loan.findMany({
      where: { tenantId, disbursementDate: { gte: start, lte: end } },
      select: { loanAmount: true, interestRate: true },
    });

    const interestGenerated = newLoans.reduce((sum, l) => {
      const amount = l.loanAmount.toNumber();
      const rate = l.interestRate.toNumber();
      return sum + amount * (rate / 100);
    }, 0);

    const totalCollected = collected._sum.amountPaid?.toNumber() || 0;
    const totalLent = lent._sum.loanAmount?.toNumber() || 0;
    const totalDiscounts = lent._sum.totalDiscounts?.toNumber() || 0;
    const totalCosts = lent._sum.totalCosts?.toNumber() || 0;
    const totalExpenses = expenses._sum.amount?.toNumber() || 0;

    const netProfit = interestGenerated - totalCosts;
    const liquidated = totalCollected - totalLent + totalDiscounts - totalExpenses - totalCosts;

    const refinancings = await this.prisma.refinancing.aggregate({
      where: { tenantId, refinancingDate: { gte: start, lte: end } },
      _sum: { newAmount: true },
      _count: true,
    });

    const [payments, loans, expensesList, refinancingsList] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenantId, paymentDate: { gte: start, lte: end } },
        include: {
          loan: { include: { client: { select: { fullName: true } } } },
          collector: { select: { username: true } },
          route: { select: { name: true } },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.loan.findMany({
        where: { tenantId, disbursementDate: { gte: start, lte: end } },
        include: {
          client: { select: { fullName: true, route: { select: { name: true } } } },
          costs: { include: { concept: { select: { name: true } } } },
          discounts: { include: { concept: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { tenantId, date: { gte: start, lte: end } },
        include: { route: { select: { name: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.refinancing.findMany({
        where: { tenantId, refinancingDate: { gte: start, lte: end } },
        include: {
          previousLoan: { include: { client: { select: { fullName: true } } } },
          createdBy: { select: { username: true } },
        },
        orderBy: { refinancingDate: 'desc' },
      }),
    ]);

    const paymentsByRoute = payments.reduce((acc, p) => {
      const routeName = p.route.name;
      if (!acc[routeName]) acc[routeName] = { total: 0, count: 0, payments: [] };
      acc[routeName].total += p.amountPaid.toNumber();
      acc[routeName].count += 1;
      acc[routeName].payments.push({
        id: p.id,
        amount: p.amountPaid.toNumber(),
        clientName: p.loan.client.fullName,
        date: p.paymentDate.toISOString(),
        collectorName: p.collector.username,
      });
      return acc;
    }, {} as any);

    const loansByRoute = loans.reduce((acc, l) => {
      const routeName = l.client.route.name;
      if (!acc[routeName]) acc[routeName] = { total: 0, count: 0, loans: [] };
      acc[routeName].total += l.loanAmount.toNumber();
      acc[routeName].count += 1;
      acc[routeName].loans.push({
        id: l.id,
        clientName: l.client.fullName,
        loanAmount: l.loanAmount.toNumber(),
        receivedAmount: l.receivedAmount.toNumber(),
        discounts: l.totalDiscounts.toNumber(),
        costs: l.totalCosts.toNumber(),
        date: l.disbursementDate.toISOString(),
      });
      return acc;
    }, {} as any);

    const discountsByRoute = loans.reduce((acc, l) => {
      const routeName = l.client.route.name;
      if (!acc[routeName]) acc[routeName] = {};
      l.discounts.forEach((d) => {
        const concept = d.concept.name;
        if (!acc[routeName][concept]) acc[routeName][concept] = 0;
        acc[routeName][concept] += d.discountAmount.toNumber();
      });
      return acc;
    }, {} as any);

    const costsByRoute = loans.reduce((acc, l) => {
      const routeName = l.client.route.name;
      if (!acc[routeName]) acc[routeName] = {};
      l.costs.forEach((c) => {
        const concept = c.concept.name;
        if (!acc[routeName][concept]) acc[routeName][concept] = 0;
        acc[routeName][concept] += c.costAmount.toNumber();
      });
      return acc;
    }, {} as any);

    const expensesByRoute = expensesList.reduce((acc, e) => {
      const routeName = e.route.name;
      if (!acc[routeName]) acc[routeName] = { total: 0, count: 0, expenses: [] };
      acc[routeName].total += e.amount.toNumber();
      acc[routeName].count += 1;
      acc[routeName].expenses.push({
        id: e.id,
        amount: e.amount.toNumber(),
        description: e.description,
        date: e.date.toISOString(),
      });
      return acc;
    }, {} as any);

    return {
      period: { startDate, endDate },
      metrics: {
        collected: totalCollected,
        paymentCount: collected._count,
        lent: totalLent,
        discountsCollected: totalDiscounts,
        loanCosts: totalCosts,
        newLoans: lent._count,
        expenses: totalExpenses,
        expenseCount: expenses._count,
        refinancings: refinancings._count,
        refinancedAmount: refinancings._sum.newAmount?.toNumber() || 0,
        liquidated,
        interestGenerated,
        netProfit,
      },
      details: {
        paymentsByRoute,
        loansByRoute,
        discountsByRoute,
        costsByRoute,
        expensesByRoute,
        refinancings: refinancingsList.map((r) => ({
          id: r.id,
          clientName: r.previousLoan.client.fullName,
          previousBalance: r.previousPendingBalance.toNumber(),
          newAmount: r.newAmount.toNumber(),
          deliveredAmount: r.deliveredAmount.toNumber(),
          date: r.refinancingDate.toISOString(),
          createdBy: r.createdBy.username,
        })),
      },
    };
  }

  async getRouteComparison(tenantId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const routes = await this.prisma.route.findMany({
      where: { tenantId, active: true },
      include: { _count: { select: { clients: true } } },
    });

    const routesData = await Promise.all(
      routes.map(async (route) => {
        const collected = await this.prisma.payment.aggregate({
          where: { routeId: route.id, paymentDate: { gte: targetDate, lte: endDate } },
          _sum: { amountPaid: true },
          _count: true,
        });

        const activeLoans = await this.prisma.loan.findMany({
          where: {
            tenantId,
            client: { routeId: route.id },
            status: { in: ['ACTIVO', 'MORA'] },
          },
          select: { installmentValue: true, paymentFrequency: true, collectionStartDate: true },
        });

        let expected = 0;
        activeLoans.forEach((l) => {
          const daysSinceStart = Math.floor((targetDate.getTime() - new Date(l.collectionStartDate).getTime()) / (1000 * 60 * 60 * 24));
          if (l.paymentFrequency === 'DIARIO' && daysSinceStart >= 0) {
            expected += Number(l.installmentValue);
          } else if (l.paymentFrequency === 'SEMANAL' && daysSinceStart >= 0 && daysSinceStart % 7 === 0) {
            expected += Number(l.installmentValue);
          }
        });

        const overdueClients = await this.prisma.loan.count({
          where: { client: { routeId: route.id }, status: 'MORA' },
        });

        const totalCollected = collected._sum.amountPaid?.toNumber() || 0;
        const compliancePercentage = expected > 0 ? (totalCollected / expected) * 100 : 0;

        return {
          routeId: route.id,
          routeName: route.name,
          totalClients: route._count.clients,
          collected: totalCollected,
          expected,
          compliancePercentage: Math.round(compliancePercentage * 100) / 100,
          paymentCount: collected._count,
          overdueClients,
        };
      }),
    );

    routesData.sort((a, b) => b.compliancePercentage - a.compliancePercentage);

    return {
      date: targetDate.toISOString().split('T')[0],
      routes: routesData,
      totals: {
        collected: routesData.reduce((sum, r) => sum + r.collected, 0),
        expected: routesData.reduce((sum, r) => sum + r.expected, 0),
        paymentCount: routesData.reduce((sum, r) => sum + r.paymentCount, 0),
      },
    };
  }
}
