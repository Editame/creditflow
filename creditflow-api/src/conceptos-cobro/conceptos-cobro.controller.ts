import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ConceptosCobroService } from './conceptos-cobro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('conceptos-cobro')
@UseGuards(JwtAuthGuard)
export class ConceptosCobroController {
  constructor(private readonly conceptosCobroService: ConceptosCobroService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.conceptosCobroService.findAll(tenantId);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() data: any) {
    return this.conceptosCobroService.create(tenantId, data);
  }
}
