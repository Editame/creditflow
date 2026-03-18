import { Module } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseGeneratorService } from './license-generator.service';
import { LicenseGeneratorController } from './license-generator.controller';
import { PrismaService } from '../database/prisma.service';
import { FeaturesModule } from '../features/features.module';

@Module({
  imports: [FeaturesModule],
  controllers: [LicenseGeneratorController],
  providers: [LicenseService, LicenseGeneratorService, PrismaService],
  exports: [LicenseService, LicenseGeneratorService],
})
export class LicenseModule {}
