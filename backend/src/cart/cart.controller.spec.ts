jest.mock('nest-keycloak-connect', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  RoleGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  Roles: jest.fn().mockImplementation(() => () => {}),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { Request } from 'express';

describe('CartController', () => {
  let controller: CartController;
  let service: CartService;

  const mockCartService = {
    addItem: jest.fn().mockResolvedValue({ success: true }),
    getCart: jest.fn().mockResolvedValue([]),
    removeItem: jest.fn().mockResolvedValue({ success: true }),
    clearCart: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockAuthGuard = {
    canActivate: () => true,
  };

  const mockRolesGuard = {
    canActivate: () => true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: mockCartService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get cart items for user', async () => {
    const req = { user: { sub: 'user-1' } } as unknown as Request & {
      user?: { sub: string };
    };
    await controller.getCart(req);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.getCart).toHaveBeenCalledWith('user-1');
  });
});
