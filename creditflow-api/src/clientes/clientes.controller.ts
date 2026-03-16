import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenant } from '../common';
import type { CreateClientDto, UpdateClientDto, FilterClientDto } from '@creditflow/shared-types';

@ApiTags('Clientes')
@Controller('clientes')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() createClientDto: CreateClientDto) {
    return this.clientesService.create(tenantId, createClientDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() filters: FilterClientDto) {
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
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientesService.update(tenantId, id, updateClientDto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(tenantId, id);
  }
}
