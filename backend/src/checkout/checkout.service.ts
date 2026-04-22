import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { RedisService } from '../shared/redis/redis.service';
import { PaymentService } from '../payment/payment.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CheckoutRequestDto } from './dto/checkout.dto';
import { PaymentMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private checkAndDeductScript: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly paymentService: PaymentService,
    private readonly loyaltyService: LoyaltyService,
    @InjectQueue('order-expiration') private readonly expirationQueue: Queue,
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

  async validateVoucher(voucherCode: string, totalAmount: number) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: voucherCode },
    });

    if (
      !voucher ||
      !voucher.is_active ||
      voucher.used_count >= voucher.usage_limit
    ) {
      throw new BadRequestException(
        'Mã giảm giá không hợp lệ hoặc đã hết lượt',
      );
    }

    if (
      voucher.min_order_value &&
      totalAmount < Number(voucher.min_order_value)
    ) {
      throw new BadRequestException('Đơn hàng chưa đạt giá trị tối thiểu');
    }

    let discountAmount = 0;
    if (voucher.discount_type === 'FIXED') {
      discountAmount = Number(voucher.discount_value);
    } else {
      discountAmount = totalAmount * (Number(voucher.discount_value) / 100);
      if (
        voucher.max_discount_value &&
        discountAmount > Number(voucher.max_discount_value)
      ) {
        discountAmount = Number(voucher.max_discount_value);
      }
    }

    if (discountAmount > totalAmount) {
      discountAmount = totalAmount; // Prevent negative total
    }

    return {
      voucher,
      discountAmount,
    };
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

    // 3. Check Voucher and calculate discount
    let voucher = null;
    let totalDiscountAmount = 0;
    if (dto.voucherCode) {
      const validation = await this.validateVoucher(
        dto.voucherCode,
        totalAmount,
      );
      voucher = validation.voucher;
      totalDiscountAmount = validation.discountAmount;
    }

    const finalOrderTotalBeforeCoins = totalAmount - totalDiscountAmount;
    let finalOrderTotal = finalOrderTotalBeforeCoins;
    let usedCoins = 0;

    if (dto.usePomeloCoins && dto.usePomeloCoins > 0) {
      const balance = await this.loyaltyService.getCoinBalance(userId);
      if (balance < dto.usePomeloCoins) {
        throw new BadRequestException('Không đủ Pomelo Coins');
      }
      usedCoins =
        dto.usePomeloCoins > finalOrderTotalBeforeCoins
          ? finalOrderTotalBeforeCoins
          : dto.usePomeloCoins;
      finalOrderTotal = finalOrderTotalBeforeCoins - usedCoins;
    }

    // 4. SubOrder splitting (grouping items by Store ID)
    const storeGroups = new Map<string, typeof itemsWithPrice>();
    for (const item of itemsWithPrice) {
      if (!storeGroups.has(item.storeId)) {
        storeGroups.set(item.storeId, []);
      }
      storeGroups.get(item.storeId)!.push(item);
    }

    // 5. Create Order and SubOrders in a transaction
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Create main order
        const createdOrder = await tx.order.create({
          data: {
            buyer_id: userId,
            total_amount: finalOrderTotal,
            discount_amount: totalDiscountAmount + usedCoins, // Total discount includes coins for now
            voucher_id: voucher?.id,
            status: 'PENDING_PAYMENT',
          },
        });

        if (voucher) {
          await tx.voucher.update({
            where: { id: voucher.id },
            data: { used_count: { increment: 1 } },
          });
        }

        // Create sub orders and items
        for (const [storeId, items] of storeGroups.entries()) {
          const subTotalAmount = items.reduce(
            (sum, item) => sum + item.subtotal,
            0,
          );

          // Prorating Math for SubOrder
          let proratedDiscount = 0;
          if (totalDiscountAmount > 0 && totalAmount > 0) {
            proratedDiscount =
              (subTotalAmount / totalAmount) * totalDiscountAmount;
          }
          const finalSubTotal = Math.max(0, subTotalAmount - proratedDiscount);

          await tx.subOrder.create({
            data: {
              order_id: createdOrder.id,
              store_id: storeId,
              total_amount: finalSubTotal,
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
            amount: finalOrderTotal,
            method: dto.paymentMethod as PaymentMethod,
            status: 'PENDING',
          },
        });

        if (usedCoins > 0) {
          await this.loyaltyService.spendCoins(
            userId,
            usedCoins,
            createdOrder.id,
          );
        }

        return createdOrder;
      });

      // 5. Generate Payment URL if VNPay
      let paymentUrl = null;
      if (dto.paymentMethod === 'VNPAY') {
        paymentUrl = this.paymentService.createVNPayUrl(
          order.id,
          finalOrderTotal,
          ipAddress,
        );
      }

      // 6. Add expiration job to BullMQ (15 minutes)
      await this.expirationQueue.add(
        'check-unpaid-order',
        { orderId: order.id },
        { delay: 15 * 60 * 1000 },
      );

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
