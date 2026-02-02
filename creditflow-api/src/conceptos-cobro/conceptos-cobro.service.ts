import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ConceptosCobroService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { nombre: string; porcentaje: number; tipo: string; descripcion?: string }) {
    return this.prisma.conceptoCobro.create({
      data: { ...data, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.conceptoCobro.findMany({
      where: { tenantId, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async calculateDescuentos(loanAmount: number, concepts: Array<{ conceptoId: number; porcentaje?: number }>) {
    let totalDescuentos = 0;
    const descuentosCalculados = [];

    for (const item of concepts) {
      const concept = await this.prisma.conceptoCobro.findUnique({
        where: { id: item.conceptoId },
      });

      if (!concept || concept.tipo !== 'DESCUENTO') {
        throw new NotFoundException(`Concepto ${item.conceptoId} no encontrado`);
      }

      const percentage = item.porcentaje ?? Number(concept.porcentaje);
      const montoDescuento = (loanAmount * percentage) / 100;

      totalDescuentos += montoDescuento;
      descuentosCalculados.push({
        conceptoId: item.conceptoId,
        montoDescuento,
        porcentaje: percentage,
      });
    }

    return { totalDescuentos, descuentosCalculados };
  }

  async calculateCostos(loanAmount: number, concepts: Array<{ conceptoId: number; porcentaje?: number }>) {
    let totalCostos = 0;
    const costosCalculados = [];

    for (const item of concepts) {
      const concept = await this.prisma.conceptoCobro.findUnique({
        where: { id: item.conceptoId },
      });

      if (!concept || concept.tipo !== 'COSTO') {
        throw new NotFoundException(`Concepto ${item.conceptoId} no encontrado`);
      }

      const percentage = item.porcentaje ?? Number(concept.porcentaje);
      const montoCosto = (loanAmount * percentage) / 100;

      totalCostos += montoCosto;
      costosCalculados.push({
        conceptoId: item.conceptoId,
        montoCosto,
        porcentaje: percentage,
      });
    }

    return { totalCostos, costosCalculados };
  }
}
