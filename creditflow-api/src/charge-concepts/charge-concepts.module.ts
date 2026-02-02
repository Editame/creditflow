import { Module } from '@nestjs/common';
import { ChargeConceptsService } from './charge-concepts.service';
import { ChargeConceptsController } from './charge-concepts.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ChargeConceptsController],
  providers: [ChargeConceptsService],
  exports: [ChargeConceptsService],
})
export class ChargeConceptsModule {}
