import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConceptosCobroService } from '../conceptos-cobro/conceptos-cobro.service';
import { createPaginatedResponse, getPaginationParams, calculatePeriodsElapsed, addDaysToDate, getNowInTimezone } from '../common';
import { EstadoPrestamo, FrecuenciaPago } from '@prisma/client';

@Injectable()
export class PrestamosService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ConceptosCobroService))
    private conceptosCobroService: ConceptosCobroService,
  ) {}

  async create(tenantId: string, createPrestamoDto: any) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: createPrestamoDto.clienteId, tenantId, activo: true },
    });

    if (!cliente) throw new NotFoundException('Cliente no encontrado o inactivo');

    let totalDescuentos = 0;
    let descuentosCalculados: any[] = [];

    if (createPrestamoDto.conceptosDescuento?.length > 0) {
      const result = await this.conceptosCobroService.calculateDescuentos(createPrestamoDto.montoPrestado, createPrestamoDto.conceptosDescuento);
      totalDescuentos = result.totalDescuentos;
      descuentosCalculados = result.descuentosCalculados;
    }

    let totalCostos = 0;
    let costosCalculados: any[] = [];

    if (createPrestamoDto.conceptosCosto?.length > 0) {
      const result = await this.conceptosCobroService.calculateCostos(createPrestamoDto.montoPrestado, createPrestamoDto.conceptosCosto);
      totalCostos = result.totalCostos;
      costosCalculados = result.costosCalculados;
    }

    const montoRecibido = createPrestamoDto.montoPrestado - totalDescuentos;
    const montoDesembolsado = montoRecibido + totalCostos;
    const montoTotalConIntereses = createPrestamoDto.montoPrestado * (1 + createPrestamoDto.tasaInteres / 100);

    const fechaDesembolso = new Date(createPrestamoDto.fechaDesembolso);
    const fechaInicioCobro = createPrestamoDto.fechaInicioCobro ? new Date(createPrestamoDto.fechaInicioCobro) : new Date(fechaDesembolso.getTime() + 24 * 60 * 60 * 1000);

    let fechaFin: Date;
    let valorCuota: number;

    if (createPrestamoDto.fechaFin) {
      fechaFin = new Date(createPrestamoDto.fechaFin);
      const numeroPeriodos = this.calculatePeriodsBetweenDates(fechaInicioCobro, fechaFin, createPrestamoDto.frecuenciaPago);
      valorCuota = numeroPeriodos > 0 ? Math.ceil(montoTotalConIntereses / numeroPeriodos) : montoTotalConIntereses;
    } else if (createPrestamoDto.valorCuota) {
      valorCuota = createPrestamoDto.valorCuota;
      const numeroCuotas = Math.ceil(montoTotalConIntereses / valorCuota);
      fechaFin = this.calculateEndDate(fechaInicioCobro, numeroCuotas, createPrestamoDto.frecuenciaPago);
    } else {
      const periodos = createPrestamoDto.frecuenciaPago === FrecuenciaPago.DIARIO ? 30 : 4;
      valorCuota = Math.ceil(montoTotalConIntereses / periodos);
      fechaFin = this.calculateEndDate(fechaInicioCobro, periodos, createPrestamoDto.frecuenciaPago);
    }

    return this.prisma.prestamo.create({
      data: {
        tenantId,
        clienteId: createPrestamoDto.clienteId,
        montoPrestado: createPrestamoDto.montoPrestado,
        montoRecibido,
        totalDescuentos,
        totalCostos,
        montoDesembolsado,
        tasaInteres: createPrestamoDto.tasaInteres,
        frecuenciaPago: createPrestamoDto.frecuenciaPago,
        valorCuota,
        saldoPendiente: montoTotalConIntereses,
        fechaDesembolso,
        fechaInicioCobro,
        fechaFin,
        fechaFinOriginal: fechaFin,
        estado: EstadoPrestamo.ACTIVO,
        descuentos: descuentosCalculados.length > 0 ? { create: descuentosCalculados } : undefined,
        costos: costosCalculados.length > 0 ? { create: costosCalculados } : undefined,
      },
      include: {
        cliente: true,
        descuentos: { include: { concepto: true } },
        costos: { include: { concepto: true } },
      },
    });
  }

  async refinanciar(tenantId: string, refinanciarDto: any, userId: number) {
    const prestamoAnterior = await this.prisma.prestamo.findFirst({
      where: { id: refinanciarDto.prestamoAnteriorId, tenantId },
      include: { cliente: true },
    });

    if (!prestamoAnterior) throw new NotFoundException('Préstamo anterior no encontrado');
    if (prestamoAnterior.estado === EstadoPrestamo.PAGADO) throw new BadRequestException('No se puede refinanciar un préstamo ya pagado');

    const saldoPendienteAnterior = Number(prestamoAnterior.saldoPendiente);

    if (refinanciarDto.montoNuevo <= saldoPendienteAnterior) {
      throw new BadRequestException(`El monto nuevo debe ser mayor al saldo pendiente ($${saldoPendienteAnterior})`);
    }

    let totalDescuentos = 0;
    let descuentosCalculados: any[] = [];

    if (refinanciarDto.conceptosDescuento?.length > 0) {
      const result = await this.conceptosCobroService.calculateDescuentos(refinanciarDto.montoNuevo, refinanciarDto.conceptosDescuento);
      totalDescuentos = result.totalDescuentos;
      descuentosCalculados = result.descuentosCalculados;
    }

    let totalCostos = 0;
    let costosCalculados: any[] = [];

    if (refinanciarDto.conceptosCosto?.length > 0) {
      const result = await this.conceptosCobroService.calculateCostos(refinanciarDto.montoNuevo, refinanciarDto.conceptosCosto);
      totalCostos = result.totalCostos;
      costosCalculados = result.costosCalculados;
    }

    const montoRecibido = refinanciarDto.montoNuevo - totalDescuentos;
    const montoEntregado = montoRecibido - saldoPendienteAnterior;
    const montoDesembolsado = montoRecibido + totalCostos;
    const montoTotalConIntereses = refinanciarDto.montoNuevo * (1 + refinanciarDto.tasaInteres / 100);

    const fechaDesembolso = refinanciarDto.fechaDesembolso ? new Date(refinanciarDto.fechaDesembolso) : getNowInTimezone();
    const fechaInicioCobro = refinanciarDto.fechaInicioCobro ? new Date(refinanciarDto.fechaInicioCobro) : new Date(fechaDesembolso.getTime() + 24 * 60 * 60 * 1000);

    let fechaFin: Date;
    let valorCuota: number;

    if (refinanciarDto.fechaFin) {
      fechaFin = new Date(refinanciarDto.fechaFin);
      const numeroPeriodos = this.calculatePeriodsBetweenDates(fechaInicioCobro, fechaFin, refinanciarDto.frecuenciaPago);
      valorCuota = numeroPeriodos > 0 ? Math.ceil(montoTotalConIntereses / numeroPeriodos) : montoTotalConIntereses;
    } else if (refinanciarDto.valorCuota) {
      valorCuota = refinanciarDto.valorCuota;
      const numeroCuotas = Math.ceil(montoTotalConIntereses / valorCuota);
      fechaFin = this.calculateEndDate(fechaInicioCobro, numeroCuotas, refinanciarDto.frecuenciaPago);
    } else {
      const periodos = refinanciarDto.frecuenciaPago === 'DIARIO' ? 30 : 4;
      valorCuota = Math.ceil(montoTotalConIntereses / periodos);
      fechaFin = this.calculateEndDate(fechaInicioCobro, periodos, refinanciarDto.frecuenciaPago);
    }

    return this.prisma.$transaction(async (tx) => {
      const prestamoNuevo = await tx.prestamo.create({
        data: {
          tenantId,
          clienteId: prestamoAnterior.clienteId,
          montoPrestado: refinanciarDto.montoNuevo,
          montoRecibido,
          totalDescuentos,
          totalCostos,
          montoDesembolsado,
          tasaInteres: refinanciarDto.tasaInteres,
          frecuenciaPago: refinanciarDto.frecuenciaPago,
          valorCuota,
          saldoPendiente: montoTotalConIntereses,
          fechaDesembolso,
          fechaInicioCobro,
          fechaFin,
          fechaFinOriginal: fechaFin,
          estado: EstadoPrestamo.ACTIVO,
          creadoPorId: userId,
          descuentos: descuentosCalculados.length > 0 ? { create: descuentosCalculados } : undefined,
          costos: costosCalculados.length > 0 ? { create: costosCalculados } : undefined,
        },
        include: {
          cliente: true,
          descuentos: { include: { concepto: true } },
          costos: { include: { concepto: true } },
        },
      });

      await tx.pago.create({
        data: {
          tenantId,
          prestamoId: prestamoAnterior.id,
          cobradorId: userId,
          rutaId: prestamoAnterior.cliente.rutaId,
          montoPagado: saldoPendienteAnterior,
          fechaPago: fechaDesembolso,
          observaciones: `Pago automático por refinanciamiento a préstamo #${prestamoNuevo.id}`,
        },
      });

      await tx.prestamo.update({
        where: { id: prestamoAnterior.id },
        data: { saldoPendiente: 0, estado: EstadoPrestamo.PAGADO },
      });

      const refinanciamiento = await tx.refinanciamiento.create({
        data: {
          tenantId,
          prestamoAnteriorId: prestamoAnterior.id,
          prestamoNuevoId: prestamoNuevo.id,
          saldoPendienteAnterior,
          montoNuevo: refinanciarDto.montoNuevo,
          montoEntregado,
          motivoRefinanciamiento: refinanciarDto.motivoRefinanciamiento,
          fechaRefinanciamiento: fechaDesembolso,
          creadoPorId: userId,
        },
      });

      return { prestamoNuevo, prestamoAnterior, refinanciamiento, montoEntregado };
    });
  }

  private calculateEndDate(startDate: Date, numPayments: number, frequency: FrecuenciaPago): Date {
    const daysToAdd = frequency === FrecuenciaPago.DIARIO ? numPayments : numPayments * 7;
    return addDaysToDate(startDate, daysToAdd);
  }

  private calculatePeriodsBetweenDates(startDate: Date, endDate: Date, frequency: FrecuenciaPago): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return frequency === FrecuenciaPago.DIARIO ? Math.max(1, diffDays) : Math.max(1, Math.ceil(diffDays / 7));
  }
}
