import { Controller, Post, Body, Param, UseGuards, Res, ForbiddenException } from '@nestjs/common';
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

  private assertSuperAdmin(user: any) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Acceso denegado');
  }

  private buildOptions(dto: GenerateLicenseDto) {
    return {
      contactEmail: dto.contactEmail,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      supportEndsAt: dto.supportEndsAt ? new Date(dto.supportEndsAt) : undefined,
    };
  }

  @Post('generate')
  async generateLicense(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() dto: GenerateLicenseDto,
    @Res() res: Response,
  ) {
    this.assertSuperAdmin(user);
    try {
      const signedLicense = await this.licenseGenerator.generateLicenseForTenant(tenantId, this.buildOptions(dto));
      const tenantSlug = signedLicense.data.tenantSlug;
      const filePath = await this.licenseGenerator.saveLicenseFile(tenantSlug, signedLicense);

      res.download(filePath, `license-${tenantSlug}.json`, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Error sending license file' });
        }
      });
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate license', message: (error as Error).message });
      }
    }
  }

  @Post('preview')
  async previewLicense(
    @CurrentUser() user: any,
    @Param('tenantId') tenantId: string,
    @Body() dto: GenerateLicenseDto,
  ) {
    this.assertSuperAdmin(user);
    const signedLicense = await this.licenseGenerator.generateLicenseForTenant(tenantId, {
      ...this.buildOptions(dto),
      saveToDb: false,
    });

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
  }
}