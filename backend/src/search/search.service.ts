import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly INDEX_NAME = 'products'; // Alias index sinh ra từ Kafka Sink

  constructor(private readonly esService: ElasticsearchService) {}

  async searchProducts(query: string, page = 1, limit = 20) {
    try {
      const from = (page - 1) * limit;

      const { hits } = await this.esService.search({
        index: this.INDEX_NAME,
        from,
        size: limit,
        query: {
          bool: {
            must: {
              multi_match: {
                query,
                fields: ['name^3', 'description', 'brand.name'], // Ưu tiên Name gấp 3
                fuzziness: 'AUTO',
                operator: 'and',
              },
            },
          },
        },
      });

      return {
        total:
          typeof hits.total === 'number'
            ? hits.total
            : (((hits.total as unknown as Record<string, unknown>)
                ?.value as number) ?? 0),
        items: hits.hits.map((hit) => hit._source),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Elasticsearch failed: ${err.message}`);
      // Fallback: Nếu không có ES, ta ném ra array rỗng thay vì làm sập trang Frontend
      return { total: 0, items: [] };
    }
  }

  // Khỏi tạo mapping index (Dùng khi cần tạo thủ công thay vì dưa vào Kafka Auto-created index)
  async createIndexIfNotExists() {
    const exists = await this.esService.indices.exists({
      index: this.INDEX_NAME,
    });
    if (!exists) {
      await this.esService.indices.create({
        index: this.INDEX_NAME,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: {
              type: 'text',
              analyzer: 'standard', // Sẽ được upgrade lên n-gram ở cấp độ nâng cao
            },
            description: { type: 'text' },
            base_price: { type: 'double' },
            // Nối JSON thông qua Kafka Sink
          },
        },
      });
      this.logger.log(`Created new ES Index ${this.INDEX_NAME}`);
    }
  }
}
