import { Controller, Post, Param, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':id/refund')
  async requestRefund(
    @Param('id') orderId: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.initiateRefund(orderId, reason);
  }
}
