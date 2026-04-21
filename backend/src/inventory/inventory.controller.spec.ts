jest.mock('nest-keycloak-connect', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  RoleGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  Roles: jest.fn().mockImplementation(() => () => {}),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';

describe('InventoryController', () => {
  let controller: InventoryController;

  const mockInventoryService = {
    importGood: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockAuthGuard = {
    canActivate: () => true,
  };

  const mockRolesGuard = {
    canActivate: () => true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
