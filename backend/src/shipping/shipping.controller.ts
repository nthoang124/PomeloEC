import { Controller, Post, Param, Body } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { Unprotected } from 'nest-keycloak-connect';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Unprotected()
  @Post('create-label/:subOrderId')
  async createLabel(@Param('subOrderId') subOrderId: string) {
    return this.shippingService.createLabel(subOrderId);
  }

  @Unprotected()
  @Post('webhook')
  async handleWebhook(
    @Body() payload: { trackingCode: string; status: string },
  ) {
    return this.shippingService.handleWebhook(
      payload.trackingCode,
      payload.status,
    );
  }
}
