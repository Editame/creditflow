import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RutasService } from './rutas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common';
import type { CreateRutaDto, UpdateRutaDto, PaginationParams } from '@creditflow/shared-types';

@ApiTags('Rutas')
@Controller('rutas')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createRutaDto: CreateRutaDto) {
    return this.rutasService.create(tenantId, createRutaDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() pagination: PaginationParams) {
    return this.rutasService.findAll(tenantId, pagination);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.rutasService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRutaDto: UpdateRutaDto,
  ) {
    return this.rutasService.update(tenantId, id, updateRutaDto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.rutasService.remove(tenantId, id);
  }
}
