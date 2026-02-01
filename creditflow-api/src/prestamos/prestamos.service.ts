import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import { FrecuenciaPago, EstadoPrestamo } from '@creditflow/shared-types';
import type { CreatePrestamoDto, FilterPrestamoDto } from '@creditflow/shared-types';

@Injectable()
export class PrestamosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createPrestamoDto: CreatePrestamoDto) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: createPrestamoDto.clienteId, tenantId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente not found');
    }

    const montoTotal = createPrestamoDto.montoPrestado * (1 + createPrestamoDto.tasaInteres / 100);
    const fechaInicio = new Date(createPrestamoDto.fechaInicio);
    const numeroCuotas = Math.ceil(montoTotal / createPrestamoDto.valorCuota);
    const fechaFin = this.calculateEndDate(fechaInicio, numeroCuotas, createPrestamoDto.frecuenciaPago);

    return this.prisma.prestamo.create({
      data: {
        tenantId,
        clienteId: createPrestamoDto.clienteId,
        montoPrestado: createPrestamoDto.montoPrestado,
        tasaInteres: createPrestamoDto.tasaInteres,
        frecuenciaPago: createPrestamoDto.frecuenciaPago,
        valorCuota: createPrestamoDto.valorCuota,
        saldoPendiente: montoTotal,
        fechaInicio,
        fechaFin,
        estado: EstadoPrestamo.ACTIVO,
      },
      include: { cliente: true },
    });
  }

  async findAll(tenantId: string, filters: FilterPrestamoDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.clienteId) where.clienteId = filters.clienteId;
    if (filters.estado) where.estado = filters.estado;

    const [data, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where,
        skip,
        take,
        include: {
          cliente: {
            include: { ruta: true },
          },
          pagos: {
            orderBy: { fechaPago: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prestamo.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async findOne(tenantId: string, id: number) {
    const prestamo = await this.prisma.prestamo.findFirst({
      where: { id, tenantId },
      include: {
        cliente: {
          include: { ruta: true },
        },
        pagos: {
          orderBy: { fechaPago: 'desc' },
        },
      },
    });

    if (!prestamo) {
      throw new NotFoundException('Prestamo not found');
    }

    return prestamo;
  }

  private calculateEndDate(startDate: Date, numPayments: number, frequency: FrecuenciaPago): Date {
    const endDate = new Date(startDate);
    if (frequency === FrecuenciaPago.DIARIO) {
      endDate.setDate(endDate.getDate() + numPayments);
    } else {
      endDate.setDate(endDate.getDate() + numPayments * 7);
    }
    return endDate;
  }
}
