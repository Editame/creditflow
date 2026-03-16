import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common';
import type { CreateClienteDto, UpdateClienteDto, FilterClienteDto } from '@creditflow/shared-types';

@ApiTags('Clientes')
@Controller('clientes')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(tenantId, createClienteDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() filters: FilterClienteDto) {
    return this.clientesService.findAll(tenantId, filters);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clientesService.update(tenantId, id, updateClienteDto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(tenantId, id);
  }
}
