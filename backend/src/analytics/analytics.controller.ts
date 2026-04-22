import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { RevenueReportDto } from './dto/revenue-report.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @UsePipes(ZodValidationPipe)
  getRevenue(@Query() query: RevenueReportDto) {
    return this.analyticsService.getRevenueReport(
      query.startDate,
      query.endDate,
    );
  }

  @Get('inventory')
  getInventory() {
    return this.analyticsService.getInventoryReport();
  }
}
