import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { RedisService } from '../shared/redis/redis.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockPrismaService = {
    $transaction: jest
      .fn()
      .mockImplementation((cb: (args: Record<string, unknown>) => unknown) => {
        // Execute the callback with the same mock Prisma instance synchronously
        return cb({
          inventoryLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
          variant: {
            update: jest.fn().mockResolvedValue({
              id: 'variant-1',
              store_id: 'store-1',
              stock_quantity: 50,
            }),
          },
        });
      }),
    variant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'variant-1',
        stock_quantity: 50,
        product: { store_id: 'store-1' },
      }),
    },
  };

  const mockRedisService = {
    set: jest.fn().mockResolvedValue('OK'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should import goods and update redis', async () => {
    await service.importGoods(
      {
        variantId: 'variant-1',
        quantityChange: 50,
        note: 'Nhập hàng test',
      },
      'store-1',
    );
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
    expect(mockRedisService.set).toHaveBeenCalledWith(
      'INVENTORY:VARIANT:variant-1:AVAILABLE',
      '50',
    );
  });
});
