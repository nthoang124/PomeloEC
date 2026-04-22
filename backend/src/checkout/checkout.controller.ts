import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutRequestDto } from './dto/checkout.dto';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Checkout')
@Controller('checkout')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Process checkout and generate payment URL' })
  async processCheckout(
    @Req() req: Request & { user?: { sub: string } },
    @Body() dto: CheckoutRequestDto,
  ) {
    const userId = req.user?.sub || '';
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    return this.checkoutService.processCheckout(userId, dto, ipAddress);
  }
}
