import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { randomUUID } from 'crypto';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentModule } from './payment/payment.module';
import { CommunicationModule } from './communication/communication.module';
import { BackgroundJobsModule } from './background-jobs/background-jobs.module';
import { IamModule } from './iam/iam.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { RedisModule } from './shared/redis/redis.module';
import { CartModule } from './cart/cart.module';
import { SearchModule } from './search/search.module';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';
import { ShippingModule } from './shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Pino Logger Setup with traceId generation
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const existingID = req.id ?? req.headers['x-trace-id'];
          if (existingID) return existingID;
          const id = randomUUID();
          res.setHeader('x-trace-id', id);
          return id;
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),

    // Rate Limiting (DDoS prevention) - Max 100 requests per minute by default
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database
    PrismaModule,

    CheckoutModule,

    PaymentModule,

    CommunicationModule,

    BackgroundJobsModule,

    IamModule,

    CatalogModule,

    InventoryModule,

    RedisModule,

    CartModule,

    SearchModule,

    StoreModule,

    ShippingModule,

    // Add Domain Modules here...
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
