import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class InversionesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.investment.findMany({
      where: { tenantId },
      include: { returns: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: number) {
    const inv = await this.prisma.investment.findFirst({
      where: { id, tenantId },
      include: { returns: { orderBy: { date: 'desc' } } },
    });
    if (!inv) throw new NotFoundException('Inversión no encontrada');
    return inv;
  }

  async create(tenantId: string, dto: any) {
    const expectedReturn = (dto.amount * dto.interestRate) / 100;
    return this.prisma.investment.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        interestRate: dto.interestRate,
        frequency: dto.frequency,
        expectedReturn,
        startDate: new Date(dto.startDate),
        notes: dto.notes,
      },
    });
  }

  async update(tenantId: string, id: number, dto: any) {
    await this.findOne(tenantId, id);
    return this.prisma.investment.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async delete(tenantId: string, id: number) {
    const inv = await this.findOne(tenantId, id);
    if (inv.returns.length > 0) {
      throw new BadRequestException('No se puede eliminar una inversión con rendimientos registrados');
    }
    return this.prisma.investment.delete({ where: { id } });
  }

  async registerReturn(tenantId: string, investmentId: number, dto: any) {
    const inv = await this.findOne(tenantId, investmentId);
    if (inv.status === 'RECOVERED') {
      throw new BadRequestException('La inversión ya fue recuperada');
    }
    return this.prisma.investmentReturn.create({
      data: {
        investmentId,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes,
      },
    });
  }

  async recover(tenantId: string, id: number) {
    const inv = await this.findOne(tenantId, id);
    if (inv.status === 'RECOVERED') {
      throw new BadRequestException('La inversión ya fue recuperada');
    }
    return this.prisma.investment.update({
      where: { id },
      data: { status: 'RECOVERED', recoveredAt: new Date() },
    });
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [active, totalReturnsMonth, totalReturnsAll] = await Promise.all([
      this.prisma.investment.aggregate({
        where: { tenantId, status: 'ACTIVE' },
        _sum: { amount: true, expectedReturn: true },
        _count: true,
      }),
      this.prisma.investmentReturn.aggregate({
        where: {
          investment: { tenantId },
          date: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.investmentReturn.aggregate({
        where: { investment: { tenantId } },
        _sum: { amount: true },
      }),
    ]);

    return {
      activeCount: active._count,
      totalInvested: active._sum.amount?.toNumber() || 0,
      expectedMonthly: active._sum.expectedReturn?.toNumber() || 0,
      collectedThisMonth: totalReturnsMonth._sum.amount?.toNumber() || 0,
      totalCollected: totalReturnsAll._sum.amount?.toNumber() || 0,
    };
  }
}
