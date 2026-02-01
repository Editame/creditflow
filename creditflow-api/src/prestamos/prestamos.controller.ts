import { Controller, Get, Post, Body, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrestamosService } from './prestamos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common';
import type { CreatePrestamoDto, FilterPrestamoDto } from '@creditflow/shared-types';

@ApiTags('Prestamos')
@Controller('prestamos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createPrestamoDto: CreatePrestamoDto) {
    return this.prestamosService.create(tenantId, createPrestamoDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() filters: FilterPrestamoDto) {
    return this.prestamosService.findAll(tenantId, filters);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.prestamosService.findOne(tenantId, id);
  }
}
