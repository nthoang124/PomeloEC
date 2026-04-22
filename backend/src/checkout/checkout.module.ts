import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentModule } from '../payment/payment.module';
import { RedisModule } from '../shared/redis/redis.module';

@Module({
  imports: [PaymentModule, RedisModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
