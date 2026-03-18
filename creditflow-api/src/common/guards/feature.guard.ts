import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureModule } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const FEATURE_KEY = 'required-feature';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(FEATURE_KEY, context.getHandler());
    
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new ForbiddenException('User not authenticated or no tenant');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_module: {
          tenantId: user.tenantId,
          module: requiredFeature as FeatureModule,
        },
      },
    });

    if (!tenantFeature || !tenantFeature.enabled) {
      throw new ForbiddenException(
        `Feature '${requiredFeature}' is not enabled for your plan. Please upgrade to access this functionality.`
      );
    }

    return true;
  }
}