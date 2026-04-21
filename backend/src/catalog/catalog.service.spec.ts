import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('CatalogService', () => {
  let service: CatalogService;

  const mockPrismaService = {
    category: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
