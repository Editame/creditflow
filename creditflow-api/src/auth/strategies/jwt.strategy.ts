import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface JwtPayload {
  sub: number;
  username: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    _config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: _config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    // Para SUPER_ADMIN, tenant puede ser null
    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Validar tenant solo si no es SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN' && (!user.tenant || !user.tenant.active)) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    return {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
    };
  }
}
