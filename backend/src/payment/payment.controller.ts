import { Controller, Get, Query, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'VNPay IPN Webhook' })
  async vnpayIpn(@Query() query: Record<string, string>) {
    return this.paymentService.processIpnWebhook(query);
  }

  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPay Return URL after payment' })
  vnpayReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const vnp_ResponseCode = query['vnp_ResponseCode'];
    if (vnp_ResponseCode === '00') {
      return res.redirect('http://localhost:3000/success');
    } else {
      return res.redirect('http://localhost:3000/failed');
    }
  }
}
