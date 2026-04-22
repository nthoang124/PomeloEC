import { Module } from '@nestjs/common';
import { FlashSaleService } from './flash-sale.service';
import { FlashSaleController } from './flash-sale.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [FlashSaleService],
  controllers: [FlashSaleController],
  exports: [FlashSaleService],
})
export class FlashSaleModule {}
