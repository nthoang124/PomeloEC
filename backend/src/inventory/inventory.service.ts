import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { RedisService } from '../shared/redis/redis.service';
import { CreateImportDto } from './dto/create-import.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async importGoods(dto: CreateImportDto, storeId: string) {
    // 1. Kiểm tra biến thể có hợp lệ và thuộc về Store này không
    const variant = await this.prisma.variant.findUnique({
      where: { id: dto.variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new BadRequestException('Không tìm thấy biến thể hàng hóa SKU');
    }

    if (variant.product.store_id !== storeId) {
      throw new BadRequestException(
        'Quyền truy cập bị từ chối. Sản phẩm không thuộc Cửa hàng của bạn.',
      );
    }

    // 2. Transation: Tránh Race Condition khi cộng Tồn Kho (Dùng DB Lock)
    const updatedVariant = await this.prisma.$transaction(async (tx) => {
      // Ghi Sổ Nhập (Ledger)
      await tx.inventoryLedger.create({
        data: {
          variant_id: variant.id,
          quantity_change: dto.quantityChange,
          transaction_type: 'IMPORT',
        },
      });

      // Cập nhật Cột Phản ánh Tồn kho thực (Materialized View) với atomic increments
      const updated = await tx.variant.update({
        where: { id: variant.id },
        data: {
          stock_quantity: { increment: dto.quantityChange },
        },
      });

      return updated;
    });

    // 3. Pre-warm Redis (Cập nhật Cache Tồn Kho Available)
    const redisKey = `INVENTORY:VARIANT:${variant.id}:AVAILABLE`;
    await this.redis.set(redisKey, updatedVariant.stock_quantity.toString());

    return {
      message: 'Nhập kho thành công',
      variantId: variant.id,
      currentStock: updatedVariant.stock_quantity,
    };
  }

  // Tiện ích lấy tồn kho nhanh chóng từ Redis bằng Tốc độ Ánh sáng
  async getAvailableStock(variantId: string): Promise<number> {
    const redisKey = `INVENTORY:VARIANT:${variantId}:AVAILABLE`;
    const cached = await this.redis.get(redisKey);

    if (cached) {
      return parseInt(cached, 10);
    }

    // Nếu rỗng (Cache Miss) -> Lấy từ SQL DB -> Nạp ngược lại Redis
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      select: { stock_quantity: true },
    });

    if (!variant) return 0;

    await this.redis.set(redisKey, variant.stock_quantity.toString());
    return variant.stock_quantity;
  }
}
