import { Controller, Post, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { LicenseGeneratorService } from './license-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface GenerateLicenseDto {
  contactEmail?: string;
  expiresAt?: string;
  supportEndsAt?: string;
}

@Controller('admin/tenants/:tenantId/license')
@UseGuards(JwtAuthGuard)
export class LicenseGeneratorController {
  constructor(private licenseGenerator: LicenseGeneratorService) {}

  @Post('generate')
  async generateLicense(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() dto: GenerateLicenseDto,
    @Res() res: Response,
  ) {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Acceso denegado');
    try {
      // Generar licencia basada en configuración actual
      const signedLicense = await this.licenseGenerator.generateLicenseForTenant(tenantId, {
        contactEmail: dto.contactEmail,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        supportEndsAt: dto.supportEndsAt ? new Date(dto.supportEndsAt) : undefined,
      });

      // Obtener slug del tenant para el nombre del archivo
      const tenantSlug = signedLicense.data.tenantSlug;
      
      // Guardar archivo
      const filePath = await this.licenseGenerator.saveLicenseFile(tenantSlug, signedLicense);
      
      // Enviar archivo como descarga
      res.download(filePath, `license-${tenantSlug}.json`, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'Error generating license file' });
        }
      });

    } catch (error) {
      console.error('Error generating license:', error);
      res.status(500).json({ 
        error: 'Failed to generate license',
        message: (error as Error).message 
      });
    }
  }

  @Post('preview')
  async previewLicense(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() dto: GenerateLicenseDto,
  ) {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Acceso denegado');
    try {
      const signedLicense = await this.licenseGenerator.generateLicenseForTenant(tenantId, {
        contactEmail: dto.contactEmail,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        supportEndsAt: dto.supportEndsAt ? new Date(dto.supportEndsAt) : undefined,
      });

      // Retornar preview sin guardar archivo
      return {
        tenant: signedLicense.data.tenantName,
        plan: signedLicense.data.plan,
        limits: {
          users: signedLicense.data.maxUsers,
          routes: signedLicense.data.maxRoutes,
          clients: signedLicense.data.maxClients,
        },
        enabledModules: signedLicense.data.enabledModules,
        expiresAt: signedLicense.data.expiresAt,
        supportEndsAt: signedLicense.data.supportEndsAt,
        licenseKey: `${signedLicense.data.tenantSlug}-${Date.now().toString(36)}`.toUpperCase(),
      };

    } catch (error) {
      throw new Error(`Failed to preview license: ${(error as Error).message}`);
    }
  }
}