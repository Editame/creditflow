import { Module, forwardRef } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [forwardRef(() => CashModule)],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
