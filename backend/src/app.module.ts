import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { randomUUID } from 'crypto';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentModule } from './payment/payment.module';
import { CommunicationModule } from './communication/communication.module';
import { BackgroundJobsModule } from './background-jobs/background-jobs.module';

@Module({
  imports: [
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
    ThrottlerModule.forRoot([{
      ttl: 60000, 
      limit: 100,
    }]),

    // Database
    PrismaModule,

    CheckoutModule,

    PaymentModule,

    CommunicationModule,

    BackgroundJobsModule,

    // Add Domain Modules here...
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
