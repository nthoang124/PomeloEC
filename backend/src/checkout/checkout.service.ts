import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { RedisService } from '../shared/redis/redis.service';
import { PaymentService } from '../payment/payment.service';
import { CheckoutRequestDto } from './dto/checkout.dto';
import { PaymentMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private checkAndDeductScript: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly paymentService: PaymentService,
  ) {
    this.loadLuaScripts();
  }

  private loadLuaScripts() {
    try {
      const scriptPath = path.join(
        process.cwd(),
        'src/inventory/lua/check_and_deduct.lua',
      );
      this.checkAndDeductScript = fs.readFileSync(scriptPath, 'utf8');
    } catch (error) {
      this.logger.error('Failed to load Lua script', error);
      // Fallback script if file read fails (e.g., prod environment path issues)
      this.checkAndDeductScript = `
        local num_keys = #KEYS
        local sufficient_stock = true
        for i=1, num_keys do
          local stock = tonumber(redis.call("GET", KEYS[i]))
          if stock == nil or stock < tonumber(ARGV[i]) then
            sufficient_stock = false
            break
          end
        end
        if sufficient_stock then
          for i=1, num_keys do
            redis.call("DECRBY", KEYS[i], tonumber(ARGV[i]))
          end
          return 1
        else
          return 0
        end
      `;
    }
  }

  async processCheckout(
    userId: string,
    dto: CheckoutRequestDto,
    ipAddress: string,
  ) {
    this.logger.log(`Processing checkout for user ${userId}`);

    // 1. Validating items against DB to get prices
    const variantIds = dto.items.map((item) => item.variantId);
    const variants = await this.prisma.variant.findMany({
      where: { id: { in: variantIds } },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('Một số sản phẩm không tồn tại');
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Check mapping and calculate total
    let totalAmount = 0;
    const itemsWithPrice = dto.items.map((item) => {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new BadRequestException('Sản phẩm không hợp lệ');
      const subtotal = Number(variant.price) * item.quantity;
      totalAmount += subtotal;
      return {
        ...item,
        unitPrice: Number(variant.price),
        subtotal,
      };
    });

    // 2. Lock inventory using Redis Lua script
    const keys = itemsWithPrice.map((item) => `inventory:${item.variantId}`);
    const args = itemsWithPrice.map((item) => item.quantity.toString());

    const client = this.redis.getClient();
    const result = await client.eval(
      this.checkAndDeductScript,
      keys.length,
      ...keys,
      ...args,
    );

    if (result === 0) {
      throw new BadRequestException(
        'Một số sản phẩm đã hết hàng, không thể tạo đơn',
      );
    }

    // 3. SubOrder splitting (grouping items by Store ID)
    const storeGroups = new Map<string, typeof itemsWithPrice>();
    for (const item of itemsWithPrice) {
      if (!storeGroups.has(item.storeId)) {
        storeGroups.set(item.storeId, []);
      }
      storeGroups.get(item.storeId)!.push(item);
    }

    // 4. Create Order and SubOrders in a transaction
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Create main order
        const createdOrder = await tx.order.create({
          data: {
            buyer_id: userId,
            total_amount: totalAmount,
            status: 'PENDING_PAYMENT',
          },
        });

        // Create sub orders and items
        for (const [storeId, items] of storeGroups.entries()) {
          const subTotalAmount = items.reduce(
            (sum, item) => sum + item.subtotal,
            0,
          );

          await tx.subOrder.create({
            data: {
              order_id: createdOrder.id,
              store_id: storeId,
              total_amount: subTotalAmount,
              status: 'PENDING_PAYMENT',
              shipping_fee: 0, // Placeholder
              items: {
                create: items.map((item) => ({
                  variant_id: item.variantId,
                  quantity: item.quantity,
                  unit_price: item.unitPrice,
                })),
              },
            },
          });
        }

        // Create Payment record
        await tx.payment.create({
          data: {
            order_id: createdOrder.id,
            amount: totalAmount,
            method: dto.paymentMethod as PaymentMethod,
            status: 'PENDING',
          },
        });

        return createdOrder;
      });

      // 5. Generate Payment URL if VNPay
      let paymentUrl = null;
      if (dto.paymentMethod === 'VNPAY') {
        paymentUrl = this.paymentService.createVNPayUrl(
          order.id,
          totalAmount,
          ipAddress,
        );
      }

      return {
        message: 'Tạo đơn hàng thành công',
        orderId: order.id,
        paymentUrl,
      };
    } catch (error) {
      this.logger.error(
        'Failed to save order to DB. Must rollback Redis inventory',
        error,
      );
      // Rollback Redis inventory via a new Lua script or manual loop
      for (let i = 0; i < keys.length; i++) {
        await client.incrby(keys[i], Number(args[i]));
      }
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo đơn hàng');
    }
  }
}
