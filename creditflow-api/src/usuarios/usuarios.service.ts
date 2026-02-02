import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

interface CreateUserDto {
  username: string;
  email?: string;
  password: string;
  role: string;
}

interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: string;
  active?: boolean;
}

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createUserDto: CreateUserDto) {
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
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role as any,
      },
      select: {
        id: true,
        username: true,
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

  async update(tenantId: string, id: number, updateUserDto: UpdateUserDto) {
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
