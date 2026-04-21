import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;

  const mockSearchService = {
    searchProducts: jest.fn().mockResolvedValue({ total: 10, items: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockSearchService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should search products with pagination', async () => {
    const result = await controller.search('dâu tây', '1', '10');
    expect(mockSearchService.searchProducts).toHaveBeenCalledWith(
      'dâu tây',
      1,
      10,
    );
    expect(result.total).toBe(10);
  });
});
