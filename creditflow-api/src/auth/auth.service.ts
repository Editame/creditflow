import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';
import type { LoginDto, AuthResponse } from '@creditflow/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: { username, active: true },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Para SUPER_ADMIN, no validar tenant
    if (user.role !== 'SUPER_ADMIN' && (!user.tenant || !user.tenant.active)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const payload = {
      sub: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        tenantId: user.tenantId,
        username: user.username,
        email: user.email,
        role: user.role as any,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          plan: user.tenant.plan,
        } : undefined,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      email: user.email,
      role: user.role as any,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      } : undefined,
    };
  }
}
