import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/admin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.getSystemStats();
  }

  @Get('tenants')
  async getTenants(@CurrentUser() user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.getAllTenants();
  }

  @Post('tenants')
  async createTenant(@CurrentUser() user: any, @Body() createTenantDto: CreateTenantDto) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.createTenant(createTenantDto);
  }

  @Patch('tenants/:id')
  async updateTenant(@CurrentUser() user: any, @Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.updateTenant(id, updateTenantDto);
  }

  @Delete('tenants/:id')
  async deleteTenant(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.deleteTenant(id);
  }

  @Get('tenants/:id/users')
  async getTenantUsers(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.getTenantUsers(id);
  }

  @Get('tenants/:id/limits')
  async getTenantLimits(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.getTenantLimits(id);
  }

  @Post('init-features')
  async initAllFeatures(@CurrentUser() user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.initializeFeaturesForAllTenants();
  }

  @Post('licenses/generate')
  async generateLicense(@CurrentUser() user: any, @Body() licenseData: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado');
    }
    return this.adminService.generateLicense(licenseData);
  }
}