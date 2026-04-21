import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

describe('SearchService', () => {
  let service: SearchService;

  const mockElasticsearchService = {
    search: jest.fn().mockResolvedValue({
      hits: {
        total: { value: 1 },
        hits: [{ _source: { id: 'p1', name: 'Product 1' } }],
      },
    }),
    indices: {
      exists: jest.fn().mockResolvedValue(true),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ElasticsearchService, useValue: mockElasticsearchService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return mapped items from elastic', async () => {
    const result = await service.searchProducts('test', 1, 10);
    expect(mockElasticsearchService.search).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Product 1');
  });
});
