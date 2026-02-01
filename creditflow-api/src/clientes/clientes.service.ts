import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateClienteDto, UpdateClienteDto, FilterClienteDto } from '@creditflow/shared-types';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createClienteDto: CreateClienteDto) {
    const existing = await this.prisma.cliente.findUnique({
      where: { tenantId_cedula: { tenantId, cedula: createClienteDto.cedula } },
    });

    if (existing) {
      throw new ConflictException('Cliente con esta cédula ya existe');
    }

    return this.prisma.cliente.create({
      data: {
        ...createClienteDto,
        tenantId,
      },
      include: { ruta: true },
    });
  }

  async findAll(tenantId: string, filters: FilterClienteDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.rutaId) where.rutaId = filters.rutaId;
    if (filters.search) {
      where.OR = [
        { nombreCompleto: { contains: filters.search, mode: 'insensitive' } },
        { cedula: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip,
        take,
        include: {
          ruta: true,
          prestamos: {
            where: { estado: 'ACTIVO' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async findOne(tenantId: string, id: number) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, tenantId },
      include: {
        ruta: true,
        prestamos: {
          include: {
            pagos: {
              orderBy: { fechaPago: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente with ID ${id} not found`);
    }

    return cliente;
  }

  async update(tenantId: string, id: number, updateClienteDto: UpdateClienteDto) {
    await this.findOne(tenantId, id);
    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
      include: { ruta: true },
    });
  }

  async remove(tenantId: string, id: number) {
    await this.findOne(tenantId, id);
    return this.prisma.cliente.delete({
      where: { id },
    });
  }
}
