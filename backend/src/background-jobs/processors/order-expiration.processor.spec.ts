import { Test, TestingModule } from '@nestjs/testing';
import { OrderExpirationProcessor } from './order-expiration.processor';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { Job } from 'bullmq';

describe('OrderExpirationProcessor', () => {
  let processor: OrderExpirationProcessor;
  let prismaService: {
    order: { findUnique: jest.Mock; update: jest.Mock };
    orderItem: { findMany: jest.Mock };
    subOrder: { updateMany: jest.Mock };
    payment: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let redisService: {
    getClient: jest.Mock<{ incrby: jest.Mock }>;
  };

  beforeEach(async () => {
    prismaService = {
      order: { findUnique: jest.fn(), update: jest.fn() },
      orderItem: { findMany: jest.fn() },
      subOrder: { updateMany: jest.fn() },
      payment: { updateMany: jest.fn() },
      $transaction: jest.fn((callback: (prisma: unknown) => unknown) =>
        callback(prismaService),
      ),
    };

    const mockRedisClient = {
      incrby: jest.fn().mockResolvedValue(10),
    };

    redisService = {
      getClient: jest.fn(() => mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderExpirationProcessor,
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    processor = module.get<OrderExpirationProcessor>(OrderExpirationProcessor);
  });

  it('should cancel order and revert stock if payment is still PENDING_PAYMENT', async () => {
    prismaService.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: 'PENDING_PAYMENT',
      sub_orders: [{ items: [{ variant_id: 'var-1', quantity: 2 }] }],
    });
    prismaService.orderItem.findMany.mockResolvedValue([
      { variant_id: 'var-1', quantity: 2 },
    ]);

    const job = { data: { orderId: 'order-1' } } as unknown as Job<{
      orderId: string;
    }>;
    await processor.process(job);

    expect(prismaService.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'CANCELED' },
    });
    expect(redisService.getClient().incrby).toHaveBeenCalledWith(
      'inventory:var-1',
      2,
    );
  });

  it('should skip if order is not PENDING_PAYMENT', async () => {
    prismaService.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: 'PAID',
    });

    const job = { data: { orderId: 'order-1' } } as unknown as Job<{
      orderId: string;
    }>;
    await processor.process(job);

    expect(prismaService.order.update).not.toHaveBeenCalled();
    expect(redisService.getClient().incrby).not.toHaveBeenCalled();
  });
});
