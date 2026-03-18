import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { getTodayRangeInTimezone, getYesterdayRangeInTimezone } from '../common/helpers/date.helper';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminSummary(tenantId: string) {
    const now = new Date();
    const { start: todayStart, end: todayEnd } = getTodayRangeInTimezone();
    const { start: yesterdayStart, end: yesterdayEnd } = getYesterdayRangeInTimezone();

    const collectedToday = await this.prisma.payment.aggregate({
      where: { tenantId, paymentDate: { gte: todayStart, lt: todayEnd } },
      _sum: { amountPaid: true },
      _count: true,
    });

    const collectedYesterday = await this.prisma.payment.aggregate({
      where: { tenantId, paymentDate: { gte: yesterdayStart, lt: yesterdayEnd } },
      _sum: { amountPaid: true },
    });

    const expectedDaily = await this.prisma.loan.aggregate({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        paymentFrequency: 'DAILY',
        collectionStartDate: { lte: todayStart },
      },
      _sum: { installmentValue: true },
    });

    const weeklyLoans = await this.prisma.loan.findMany({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        paymentFrequency: 'WEEKLY',
      },
      select: { installmentValue: true, collectionStartDate: true },
    });

    let expectedWeekly = 0;
    weeklyLoans.forEach((l) => {
      const daysSinceStart = Math.floor((todayStart.getTime() - new Date(l.collectionStartDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart >= 0 && daysSinceStart % 7 === 0) {
        expectedWeekly += Number(l.installmentValue);
      }
    });

    const expectedToday = (expectedDaily._sum.installmentValue?.toNumber() || 0) + expectedWeekly;

    const newLoans = await this.prisma.loan.aggregate({
      where: { tenantId, disbursementDate: { gte: todayStart, lt: todayEnd } },
      _sum: { receivedAmount: true, totalDiscounts: true },
      _count: true,
    });

    const refinancingsToday = await this.prisma.refinancing.aggregate({
      where: { tenantId, refinancingDate: { gte: todayStart, lt: todayEnd } },
      _sum: { newAmount: true },
      _count: true,
    });

    const expensesToday = await this.prisma.expense.aggregate({
      where: { tenantId, date: { gte: todayStart, lt: todayEnd } },
      _sum: { amount: true },
      _count: true,
    });

    const totalCollected = collectedToday._sum.amountPaid?.toNumber() || 0;
    const totalLent = newLoans._sum.receivedAmount?.toNumber() || 0;
    const totalDiscounts = newLoans._sum.totalDiscounts?.toNumber() || 0;
    const totalExpenses = expensesToday._sum.amount?.toNumber() || 0;
    const liquidatedDay = totalCollected - totalLent + totalDiscounts - totalExpenses;

    const activePortfolio = await this.prisma.loan.aggregate({
      where: { tenantId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      _sum: { pendingBalance: true },
      _count: true,
    });

    const overduePortfolio = await this.prisma.loan.aggregate({
      where: { tenantId, status: 'OVERDUE' },
      _sum: { pendingBalance: true },
      _count: true,
    });

    const totalPortfolio = activePortfolio._sum.pendingBalance?.toNumber() || 0;
    const totalOverdue = overduePortfolio._sum.pendingBalance?.toNumber() || 0;
    const recoveryRate = expectedToday > 0 ? (totalCollected / expectedToday) * 100 : 0;
    const delinquencyRate = totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0;

    const topRoutes = await this.prisma.payment.groupBy({
      by: ['routeId'],
      where: { tenantId, paymentDate: { gte: todayStart, lt: todayEnd } },
      _sum: { amountPaid: true },
      _count: true,
      orderBy: { _sum: { amountPaid: 'desc' } },
      take: 3,
    });

    const routeIds = topRoutes.map((r) => r.routeId);
    const routes = await this.prisma.route.findMany({
      where: { tenantId, id: { in: routeIds } },
      select: { id: true, name: true },
    });

    const routesMap = new Map(routes.map((r) => [r.id, r.name]));
    const topRoutesWithName = topRoutes.map((r) => ({
      routeId: r.routeId,
      routeName: routesMap.get(r.routeId) || 'Unknown',
      totalCollected: r._sum.amountPaid?.toNumber() || 0,
      paymentCount: r._count,
    }));

    const overdueByClient = await this.prisma.loan.groupBy({
      by: ['clientId'],
      where: { tenantId, status: 'OVERDUE' },
      _sum: { pendingBalance: true },
    });

    const clientIds = overdueByClient.map((r) => r.clientId);
    const clientsWithOverdue = await this.prisma.client.findMany({
      where: { tenantId, id: { in: clientIds } },
      select: { routeId: true },
    });

    const overdueByRoute = clientsWithOverdue.reduce((acc, c) => {
      acc[c.routeId] = (acc[c.routeId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topOverdueRoutes = Object.entries(overdueByRoute)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const overdueRouteIds = topOverdueRoutes.map(([routeId]) => parseInt(routeId));
    const overdueRoutes = await this.prisma.route.findMany({
      where: { tenantId, id: { in: overdueRouteIds } },
      select: { id: true, name: true },
    });

    const overdueRoutesMap = new Map(overdueRoutes.map((r) => [r.id, r.name]));
    const topOverdueRoutesWithName = topOverdueRoutes.map(([routeId, count]) => ({
      routeId: parseInt(routeId),
      routeName: overdueRoutesMap.get(parseInt(routeId)) || 'Unknown',
      clientsOverdue: count,
    }));

    const collectedYesterdayAmount = collectedYesterday._sum.amountPaid?.toNumber() || 0;
    const dailyVariation = collectedYesterdayAmount > 0 ? ((totalCollected - collectedYesterdayAmount) / collectedYesterdayAmount) * 100 : 0;

    const [totalClients, totalRoutes, cashRegisters] = await Promise.all([
      this.prisma.client.count({ where: { tenantId, active: true } }),
      this.prisma.route.count({ where: { tenantId, active: true } }),
      this.prisma.cashRegister.findMany({
        where: { tenantId, active: true },
        select: { balance: true },
      }),
    ]);

    const cashBalance = cashRegisters.reduce((sum, r) => sum + r.balance.toNumber(), 0);

    // Investment stats (only if tenant has INVESTMENTS feature)
    const hasInvestments = await this.prisma.tenantFeature.findUnique({
      where: { tenantId_module: { tenantId, module: 'INVESTMENTS' } },
    });

    let investmentStats = null;
    if (hasInvestments?.enabled) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [activeInv, returnsMonth] = await Promise.all([
        this.prisma.investment.aggregate({
          where: { tenantId, status: 'ACTIVE' },
          _sum: { amount: true, expectedReturn: true },
          _count: true,
        }),
        this.prisma.investmentReturn.aggregate({
          where: { investment: { tenantId }, date: { gte: monthStart } },
          _sum: { amount: true },
        }),
      ]);
      investmentStats = {
        activeCount: activeInv._count,
        totalInvested: activeInv._sum.amount?.toNumber() || 0,
        expectedMonthly: activeInv._sum.expectedReturn?.toNumber() || 0,
        collectedThisMonth: returnsMonth._sum.amount?.toNumber() || 0,
      };
    }

    return {
      date: new Date().toISOString(),
      totals: {
        clients: totalClients,
        routes: totalRoutes,
        cashBalance,
      },
      metrics: {
        collectedToday: totalCollected,
        expectedToday,
        lentToday: totalLent,
        discountsCollected: totalDiscounts,
        expensesToday: totalExpenses,
        liquidatedDay,
        newLoans: newLoans._count,
        paymentCount: collectedToday._count,
        refinancings: refinancingsToday._count,
        refinancedAmount: refinancingsToday._sum.newAmount?.toNumber() || 0,
      },
      indicators: {
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        activePortfolio: totalPortfolio,
        overduePortfolio: totalOverdue,
        delinquencyRate: Math.round(delinquencyRate * 100) / 100,
        activeLoans: activePortfolio._count,
        overdueLoans: overduePortfolio._count,
      },
      comparisons: {
        collectedYesterday: collectedYesterdayAmount,
        dailyVariation: Math.round(dailyVariation * 100) / 100,
      },
      topPerformers: {
        bestRoutes: topRoutesWithName,
        routesWithMostOverdue: topOverdueRoutesWithName,
      },
      investments: investmentStats,
    };
  }
}
