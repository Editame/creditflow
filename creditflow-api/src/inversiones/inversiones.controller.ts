import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InversionesService } from './inversiones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { CurrentTenant } from '../common';

@ApiTags('Inversiones')
@Controller('inversiones')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
@RequireFeature('INVESTMENTS')
export class InversionesController {
  constructor(private readonly inversionesService: InversionesService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.inversionesService.findAll(tenantId);
  }

  @Get('stats')
  getStats(@CurrentTenant() tenantId: string) {
    return this.inversionesService.getStats(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.inversionesService.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.inversionesService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.inversionesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.inversionesService.delete(tenantId, id);
  }

  @Post(':id/rendimientos')
  registerReturn(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.inversionesService.registerReturn(tenantId, id, dto);
  }

  @Post(':id/recuperar')
  recover(@CurrentTenant() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.inversionesService.recover(tenantId, id);
  }
}
