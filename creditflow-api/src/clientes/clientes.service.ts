import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createPaginatedResponse, getPaginationParams } from '../common';
import type { CreateClientDto, UpdateClientDto, FilterClientDto } from '@creditflow/shared-types';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createClientDto: CreateClientDto) {
    const existing = await this.prisma.client.findUnique({
      where: { tenantId_idNumber: { tenantId, idNumber: createClientDto.idNumber } },
    });

    if (existing) {
      throw new ConflictException('Client with this ID number already exists');
    }

    return this.prisma.client.create({
      data: {
        tenantId,
        idNumber: createClientDto.idNumber,
        fullName: createClientDto.fullName,
        phone: createClientDto.phone,
        address: createClientDto.address,
        routeId: createClientDto.routeId,
      },
      include: { route: true },
    });
  }

  async findAll(tenantId: string, filters: FilterClientDto) {
    const { skip, take } = getPaginationParams(filters);
    
    const where: Record<string, unknown> = { tenantId };
    if (filters.routeId) where.routeId = filters.routeId;
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

  async update(tenantId: string, id: number, updateClientDto: UpdateClientDto) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...(updateClientDto.fullName && { fullName: updateClientDto.fullName }),
        ...(updateClientDto.phone && { phone: updateClientDto.phone }),
        ...(updateClientDto.address && { address: updateClientDto.address }),
        ...(updateClientDto.routeId && { routeId: updateClientDto.routeId }),
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
