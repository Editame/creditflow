import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { DatabaseModule } from '../database/database.module';
import { FeaturesModule } from '../features/features.module';

@Module({
  imports: [DatabaseModule, FeaturesModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
