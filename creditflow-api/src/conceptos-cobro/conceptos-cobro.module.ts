import { Module } from '@nestjs/common';
import { ConceptosCobroService } from './conceptos-cobro.service';
import { ConceptosCobroController } from './conceptos-cobro.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ConceptosCobroController],
  providers: [ConceptosCobroService],
  exports: [ConceptosCobroService],
})
export class ConceptosCobroModule {}
