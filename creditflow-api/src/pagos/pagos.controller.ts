import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser } from '../common';
import type { CreatePagoDto, FilterPagoDto } from '@creditflow/shared-types';

@ApiTags('Pagos')
@Controller('pagos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { id: number },
    @Body() createPagoDto: CreatePagoDto,
  ) {
    return this.pagosService.create(tenantId, user.id, createPagoDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() filters: FilterPagoDto) {
    return this.pagosService.findAll(tenantId, filters);
  }
}
