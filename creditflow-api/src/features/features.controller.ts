import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin/tenants/:tenantId/features')
@UseGuards(JwtAuthGuard)
export class FeaturesController {
  constructor(private featuresService: FeaturesService) {}

  @Get()
  async getTenantFeatures(@CurrentUser() user: any, @Param('tenantId') tenantId: string) {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Acceso denegado');
    return this.featuresService.getTenantFeatures(tenantId);
  }

  @Put()
  async updateTenantFeatures(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() body: { features: Record<string, boolean> }
  ) {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Acceso denegado');
    return this.featuresService.updateTenantFeatures(tenantId, body.features);
  }
}