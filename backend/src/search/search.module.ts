import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useFactory: () => ({
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        maxRetries: 5,
        requestTimeout: 10000,
        pingTimeout: 5000,
      }),
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
