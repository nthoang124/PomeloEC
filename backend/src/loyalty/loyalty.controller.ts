import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { AuthGuard } from 'nest-keycloak-connect';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
  };
}

@Controller('loyalty')
@UseGuards(AuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  async getBalance(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub || '';
    const balance = await this.loyaltyService.getCoinBalance(userId);
    return { balance };
  }
}
