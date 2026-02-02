import { Module, forwardRef } from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { PrestamosController } from './prestamos.controller';
import { DatabaseModule } from '../database/database.module';
import { ChargeConceptsModule } from '../charge-concepts/charge-concepts.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => ChargeConceptsModule)],
  controllers: [PrestamosController],
  providers: [PrestamosService],
  exports: [PrestamosService],
})
export class PrestamosModule {}
