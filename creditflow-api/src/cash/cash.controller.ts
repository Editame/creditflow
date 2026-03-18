import { Controller, Get, Post, Body, Query, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../common';
import type { CreateCashRegisterDto, CreateCashMovementConceptDto, CreateCashMovementDto, FilterCashMovementDto } from '@creditflow/shared-types';

@ApiTags('Cash')
@Controller('cash')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class CashController {
  constructor(private readonly cashService: CashService) {}

  // Registers
  @Post('registers')
  createRegister(@CurrentTenant() tenantId: string, @Body() dto: CreateCashRegisterDto) {
    return this.cashService.createRegister(tenantId, dto);
  }

  @Get('registers')
  getRegisters(@CurrentTenant() tenantId: string) {
    return this.cashService.getRegisters(tenantId);
  }

  @Get('registers/:id/summary')
  getRegisterSummary(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.cashService.getRegisterSummary(tenantId, id);
  }

  // Concepts
  @Get('concepts')
  getConcepts(@CurrentTenant() tenantId: string) {
    return this.cashService.getConcepts(tenantId);
  }

  @Post('concepts')
  createConcept(@CurrentTenant() tenantId: string, @Body() dto: CreateCashMovementConceptDto) {
    return this.cashService.createConcept(tenantId, dto);
  }

  // Movements
  @Post('movements')
  createMovement(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCashMovementDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.cashService.createMovement(tenantId, dto, user.id);
  }

  @Get('movements')
  getMovements(@CurrentTenant() tenantId: string, @Query() filters: FilterCashMovementDto) {
    return this.cashService.getMovements(tenantId, filters);
  }
}
