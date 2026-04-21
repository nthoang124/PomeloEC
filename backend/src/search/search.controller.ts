import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Unprotected } from 'nest-keycloak-connect';

@ApiTags('Search')
@Controller('search')
// Unprotected nghĩa là API này là Public, mọi Buyer ẩn danh đều dùng được
@Unprotected()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm (Elasticsearch Fuzzy)' })
  @ApiQuery({ name: 'q', required: true, description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!q || q.trim() === '') {
      return { total: 0, items: [] };
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.searchService.searchProducts(q, pageNum, limitNum);
  }
}
