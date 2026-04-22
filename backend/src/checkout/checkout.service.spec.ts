import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { RedisService } from '../shared/redis/redis.service';
import { PaymentService } from '../payment/payment.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let prismaService: {
    store: { findMany: jest.Mock };
    variant: { findMany: jest.Mock };
    voucher: { findUnique: jest.Mock };
    $transaction: jest.Mock;
    order: { create: jest.Mock };
    subOrder: { createMany: jest.Mock };
    orderItem: { createMany: jest.Mock };
    paymentTransaction: { create: jest.Mock };
  };
  let redisService: {
    getClient: jest.Mock;
  };
  let queueMock: {
    add: jest.Mock;
  };

  beforeEach(async () => {
    prismaService = {
      store: { findMany: jest.fn() },
      variant: { findMany: jest.fn() },
      voucher: { findUnique: jest.fn() },
      $transaction: jest.fn((callback: (prisma: unknown) => unknown) =>
        callback(prismaService),
      ),
      order: { create: jest.fn() },
      subOrder: { createMany: jest.fn() },
      orderItem: { createMany: jest.fn() },
      paymentTransaction: { create: jest.fn() },
    };

    redisService = {
      getClient: jest.fn(() => ({
        eval: jest.fn().mockResolvedValue([1, 1, 1]), // mock success
      })),
    };

    queueMock = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: redisService },
        { provide: getQueueToken('order-expiration'), useValue: queueMock },
        { provide: PaymentService, useValue: { createPaymentUrl: jest.fn() } },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  it('should calculate discount correctly for FIXED voucher', async () => {
    prismaService.voucher.findUnique.mockResolvedValue({
      id: 'v1',
      code: 'FIXED50',
      discount_type: 'FIXED',
      discount_value: 50000,
      min_order_value: 100000,
      usage_limit: 10,
      used_count: 0,
      valid_from: new Date(Date.now() - 10000),
      valid_until: new Date(Date.now() + 10000),
      is_active: true,
    });

    const result = await service.validateVoucher('FIXED50', 200000);
    expect(result.discountAmount).toBe(50000);
    expect(result.voucher.id).toBe('v1');
  });

  it('should calculate discount correctly for PERCENTAGE voucher with max limit', async () => {
    prismaService.voucher.findUnique.mockResolvedValue({
      id: 'v2',
      code: 'PERCENT10',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      max_discount_value: 30000,
      min_order_value: 100000,
      usage_limit: 10,
      used_count: 0,
      valid_from: new Date(Date.now() - 10000),
      valid_until: new Date(Date.now() + 10000),
      is_active: true,
    });

    const result = await service.validateVoucher('PERCENT10', 500000);
    // 10% of 500k is 50k, but max limit is 30k
    expect(result.discountAmount).toBe(30000);
  });
});
