import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../shared/prisma/prisma.service';
import { RedisService } from '../shared/redis/redis.service';

@Injectable()
export class FlashSaleService {
  private readonly logger = new Logger(FlashSaleService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Chạy vào 23:59 mỗi ngày để tải dữ liệu cho ngày hôm sau
  @Cron('59 23 * * *')
  async preWarmCache() {
    this.logger.log('Bắt đầu pre-warm cache cho Flash Sale ngày mai...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const upcomingSales = await this.prisma.flashSale.findMany({
      where: {
        start_time: { gte: tomorrow },
        end_time: { lte: endOfTomorrow },
        status: 'SCHEDULED',
      },
      include: {
        items: true,
      },
    });

    for (const sale of upcomingSales) {
      const cacheKey = `flashsale:${sale.id}`;
      await this.redis
        .getClient()
        .set(cacheKey, JSON.stringify(sale), 'EX', 86400 * 2); // Lưu trong 2 ngày

      // Update status
      await this.prisma.flashSale.update({
        where: { id: sale.id },
        data: { status: 'ACTIVE' },
      });

      this.logger.log(`Đã nạp Flash Sale ${sale.name} vào Redis Cache.`);
    }
  }

  async getCurrentFlashSales() {
    // Để nhanh chóng, ta có thể lấy từ Redis (ví dụ: dùng mảng keys)
    // Trong thực tế sẽ cần lưu danh sách ID các flash sale đang active
    const activeSales = await this.prisma.flashSale.findMany({
      where: { status: 'ACTIVE' },
      include: { items: true },
    });
    return activeSales;
  }
}
