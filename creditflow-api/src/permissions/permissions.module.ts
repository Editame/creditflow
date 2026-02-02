import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PermissionsController],
})
export class PermissionsModule {}
