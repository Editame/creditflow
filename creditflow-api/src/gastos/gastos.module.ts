import { Module, forwardRef } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [forwardRef(() => CashModule)],
  controllers: [GastosController],
  providers: [GastosService],
  exports: [GastosService],
})
export class GastosModule {}
