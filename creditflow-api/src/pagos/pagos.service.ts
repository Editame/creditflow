import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import { EstadoPrestamo } from '@creditflow/shared-types';
import type { CreatePagoDto, FilterPagoDto } from '@creditflow/shared-types';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: number, createPagoDto: CreatePagoDto) {
    const prestamo = await this.prisma.prestamo.findFirst({
      where: { id: createPagoDto.prestamoId, tenantId },
      include: { cliente: true },
    });

    if (!prestamo) {
      throw new NotFoundException('Prestamo not found');
    }

    if (prestamo.estado === EstadoPrestamo.PAGADO) {
      throw new BadRequestException('Loan is already fully paid');
    }

    const saldoPendiente = Number(prestamo.saldoPendiente);
    if (createPagoDto.montoPagado > saldoPendiente) {
      throw new BadRequestException('Payment exceeds pending balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          tenantId,
          prestamoId: createPagoDto.prestamoId,
          cobradorId: userId,
          rutaId: prestamo.cliente.rutaId,
          montoPagado: createPagoDto.montoPagado,
          observaciones: createPagoDto.observaciones,
        },
      });

      const newSaldo = saldoPendiente - createPagoDto.montoPagado;
      const newEstado = newSaldo <= 0 ? EstadoPrestamo.PAGADO : EstadoPrestamo.ACTIVO;

      await tx.prestamo.update({
        where: { id: createPagoDto.prestamoId },
        data: {
          saldoPendiente: newSaldo,
          estado: newEstado,
        },
      });

      return pago;
    });
  }

  async findAll(tenantId: string, filters: FilterPagoDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.rutaId) where.rutaId = filters.rutaId;
    if (filters.fecha) {
      const startOfDay = new Date(filters.fecha);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.fecha);
      endOfDay.setHours(23, 59, 59, 999);
      where.fechaPago = { gte: startOfDay, lte: endOfDay };
    }

    const [data, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        skip,
        take,
        include: {
          prestamo: {
            include: { cliente: true },
          },
          cobrador: true,
          ruta: true,
        },
        orderBy: { fechaPago: 'desc' },
      }),
      this.prisma.pago.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }
}
