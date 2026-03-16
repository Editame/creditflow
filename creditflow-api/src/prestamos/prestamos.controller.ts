import { Controller, Get, Post, Body, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrestamosService } from './prestamos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../common';
import type { CreateLoanDto, FilterLoanDto, RefinanceLoanDto } from '@creditflow/shared-types';

@ApiTags('Prestamos')
@Controller('prestamos')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createLoanDto: CreateLoanDto) {
    return this.prestamosService.create(tenantId, createLoanDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() filters: FilterLoanDto) {
    return this.prestamosService.findAll(tenantId, filters);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.prestamosService.findOne(tenantId, id);
  }

  @Post(':id/refinanciar')
  refinance(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() refinanceDto: RefinanceLoanDto,
    @CurrentUser() user: any
  ) {
    return this.prestamosService.refinance(tenantId, id, refinanceDto, user.id);
  }
}
