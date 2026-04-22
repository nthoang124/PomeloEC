import { Controller, Get, Post } from '@nestjs/common';
import { FlashSaleService } from './flash-sale.service';

@Controller('flash-sale')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Get()
  async getActiveFlashSales() {
    return this.flashSaleService.getCurrentFlashSales();
  }

  // Debug only
  @Post('trigger-cron')
  async triggerCron() {
    await this.flashSaleService.preWarmCache();
    return { message: 'Cron job triggered successfully' };
  }
}
