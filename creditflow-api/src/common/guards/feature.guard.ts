import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

export const FEATURE_KEY = 'feature';

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
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant information missing');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { features: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    const hasFeature = tenant.features.some(
      f => f.module === requiredFeature && f.enabled
    );

    if (!hasFeature) {
      throw new ForbiddenException(`Feature ${requiredFeature} not available in your plan`);
    }

    return true;
  }
}
