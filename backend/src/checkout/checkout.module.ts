import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentModule } from '../payment/payment.module';
import { RedisModule } from '../shared/redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    PaymentModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'order-expiration',
    }),
    LoyaltyModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
