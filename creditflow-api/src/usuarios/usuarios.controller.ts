import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() createUserDto: any,
  ) {
    return this.usuariosService.create(tenantId, createUserDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.usuariosService.findAll(tenantId);
  }

  @Get(':id')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usuariosService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: any,
  ) {
    return this.usuariosService.update(tenantId, id, updateUserDto);
  }

  @Delete(':id')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usuariosService.remove(tenantId, id);
  }
}
