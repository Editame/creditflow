import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('liquidation')
  async getLiquidation(
    @TenantId() tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getLiquidation(tenantId, startDate, endDate);
  }

  @Get('route-comparison')
  async getRouteComparison(@TenantId() tenantId: string, @Query('date') date?: string) {
    return this.reportsService.getRouteComparison(tenantId, date);
  }
}
