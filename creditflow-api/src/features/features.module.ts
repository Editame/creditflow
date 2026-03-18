import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [FeaturesController],
  providers: [FeaturesService, PrismaService],
  exports: [FeaturesService],
})
export class FeaturesModule {}