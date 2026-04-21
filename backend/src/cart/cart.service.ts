import { Injectable } from '@nestjs/common';
import { RedisService } from '../shared/redis/redis.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  private readonly CART_EXPIRATION_SECONDS = 30 * 24 * 60 * 60; // 30 ngày (Session hết hạn)

  constructor(private readonly redis: RedisService) {}

  async addItem(userId: string, dto: AddCartItemDto) {
    const cartKey = `CART:${userId}`;
    const fieldKey = `STORE:${dto.storeId}:VARIANT:${dto.variantId}`;

    // Lấy số lượng hiện tại nếu đã có trong giỏ rổ
    const currentQtyStr = await this.redis.getClient().hget(cartKey, fieldKey);
    const existingQty = currentQtyStr ? parseInt(currentQtyStr, 10) : 0;

    const newQty = existingQty + dto.quantity;

    // Hash Set vào Redis (O(1))
    await this.redis.hset(cartKey, fieldKey, newQty.toString());

    // Gia hạn thời gian sống (TTL)
    await this.redis.expire(cartKey, this.CART_EXPIRATION_SECONDS);

    return {
      message: 'Đã thêm vào Giỏ hàng Thành Công',
      cartItem: { variantId: dto.variantId, finalQuantity: newQty },
    };
  }

  async getCart(userId: string) {
    const cartKey = `CART:${userId}`;
    const rawCart = await this.redis.hgetall(cartKey);

    if (!rawCart || Object.keys(rawCart).length === 0) {
      return { totalUniqueItems: 0, stores: [] };
    }

    // Nhóm các items theo StoreID phục vụ Tách Đơn Hàng (Sub-Order)
    const groupedByStore: Record<
      string,
      { storeId: string; items: { variantId: string; quantity: number }[] }
    > = {};
    let totalItems = 0;

    for (const [field, quantityStr] of Object.entries(rawCart)) {
      // field format: STORE:{storeId}:VARIANT:{variantId}
      const parts = field.split(':');
      if (parts.length === 4) {
        const storeId = parts[1];
        const variantId = parts[3];
        const quantity = parseInt(quantityStr, 10);

        if (!groupedByStore[storeId]) {
          groupedByStore[storeId] = { storeId, items: [] };
        }

        groupedByStore[storeId].items.push({
          variantId,
          quantity,
        });
        totalItems += quantity;
      }
    }

    return {
      totalItems,
      stores: Object.values(groupedByStore),
    };
  }

  async removeItem(userId: string, storeId: string, variantId: string) {
    const cartKey = `CART:${userId}`;
    const fieldKey = `STORE:${storeId}:VARIANT:${variantId}`;
    await this.redis.hdel(cartKey, fieldKey);
    return { message: 'Đã xóa sản phẩm khỏi Giỏ hàng' };
  }

  async clearCart(userId: string) {
    const cartKey = `CART:${userId}`;
    await this.redis.del(cartKey);
    return { message: 'Đã dọn dẹp sạch Giỏ hàng' };
  }
}
