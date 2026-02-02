import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChargeConceptsService } from './charge-concepts.service';
import { CreateChargeConceptDto } from './dto/create-charge-concept.dto';
import { UpdateChargeConceptDto } from './dto/update-charge-concept.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('charge-concepts')
@UseGuards(JwtAuthGuard)
export class ChargeConceptsController {
  constructor(private readonly chargeConceptsService: ChargeConceptsService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() createChargeConceptDto: CreateChargeConceptDto) {
    return this.chargeConceptsService.create(tenantId, createChargeConceptDto);
  }

  @Get()
  findAll(@TenantId() tenantId: string, @Query('onlyActive') onlyActive: boolean = true) {
    return this.chargeConceptsService.findAll(tenantId, onlyActive);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.chargeConceptsService.findOne(tenantId, +id);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateChargeConceptDto: UpdateChargeConceptDto,
  ) {
    return this.chargeConceptsService.update(tenantId, +id, updateChargeConceptDto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.chargeConceptsService.remove(tenantId, +id);
  }
}
