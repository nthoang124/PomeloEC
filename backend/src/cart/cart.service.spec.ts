import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { RedisService } from '../shared/redis/redis.service';

describe('CartService', () => {
  let service: CartService;

  const mockRedisClient = {
    hget: jest.fn().mockResolvedValue('0'),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
    hgetall: jest
      .fn()
      .mockResolvedValue({ 'STORE:store-1:VARIANT:variant-1': '2' }),
    hset: jest.fn().mockResolvedValue(1),
    hdel: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get cart formatted as array', async () => {
    const result = await service.getCart('user-1');
    expect(mockRedisService.hgetall).toHaveBeenCalledWith('CART:user-1');
    expect(result.stores.length).toBeGreaterThan(0);
  });
});
