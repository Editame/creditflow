import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateClienteDto, UpdateClienteDto, FilterClienteDto } from '@creditflow/shared-types';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createClienteDto: CreateClienteDto) {
    const existing = await this.prisma.client.findUnique({
      where: { tenantId_idNumber: { tenantId, idNumber: createClienteDto.idNumber } },
    });

    if (existing) {
      throw new ConflictException('Client with this ID number already exists');
    }

    return this.prisma.client.create({
      data: {
        tenantId,
        idNumber: createClienteDto.idNumber,
        fullName: createClienteDto.fullName,
        phone: createClienteDto.phone,
        address: createClienteDto.address,
        routeId: createClienteDto.routeId,
      },
      include: { route: true },
    });
  }

  async findAll(tenantId: string, filters: FilterClienteDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.rutaId) where.routeId = filters.rutaId;
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { idNumber: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        include: {
          route: true,
          loans: {
            where: { status: 'ACTIVE' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return createPaginatedResponse(data, total, filters);
  }

  async findOne(tenantId: string, id: number) {
    const cliente = await this.prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        route: true,
        loans: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return cliente;
  }

  async update(tenantId: string, id: number, updateClienteDto: UpdateClienteDto) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...(updateClienteDto.fullName && { fullName: updateClienteDto.fullName }),
        ...(updateClienteDto.phone && { phone: updateClienteDto.phone }),
        ...(updateClienteDto.address && { address: updateClienteDto.address }),
        ...(updateClienteDto.routeId && { routeId: updateClienteDto.routeId }),
      },
      include: { route: true },
    });
  }

  async remove(tenantId: string, id: number) {
    await this.findOne(tenantId, id);
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
