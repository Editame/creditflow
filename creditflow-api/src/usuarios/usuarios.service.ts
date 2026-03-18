import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import type { CreateUsuarioDto, UpdateUsuarioDto } from '@creditflow/shared-types';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createUserDto: CreateUsuarioDto) {
    // Validar límites del tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxUsers: true, name: true }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Contar usuarios actuales del tenant
    const currentUserCount = await this.prisma.user.count({
      where: { tenantId, active: true }
    });

    if (currentUserCount >= tenant.maxUsers) {
      throw new ForbiddenException(
        `Maximum users limit reached. Your plan allows ${tenant.maxUsers} users and you currently have ${currentUserCount}. Please upgrade your plan to create more users.`
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_username: {
          tenantId,
          username: createUserDto.username,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        tenantId,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role as any,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(tenantId: string, id: number, updateUserDto: UpdateUsuarioDto) {
    await this.findOne(tenantId, id);

    const data: any = { ...updateUserDto };
    
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async remove(tenantId: string, id: number) {
    await this.findOne(tenantId, id);
    
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    });
  }
}
