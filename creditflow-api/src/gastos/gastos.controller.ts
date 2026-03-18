import { Controller, Get, Post, Body, Delete, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GastosService } from './gastos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { CurrentTenant } from '../common';
import type { CreateGastoDto, FilterGastoDto } from '@creditflow/shared-types';

@ApiTags('Gastos')
@Controller('gastos')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
@RequireFeature('EXPENSES')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createGastoDto: CreateGastoDto) {
    return this.gastosService.create(tenantId, createGastoDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() filters: FilterGastoDto) {
    return this.gastosService.findAll(tenantId, filters);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.gastosService.remove(tenantId, id);
  }
}
