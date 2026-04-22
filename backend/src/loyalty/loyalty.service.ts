import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CoinTxType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private prisma: PrismaService) {}

  async awardCoinsForOrder(
    userId: string,
    orderId: string,
    orderTotal: number,
  ) {
    // Thuật toán: 1% giá trị đơn hàng
    const coinsToAward = Math.floor(orderTotal * 0.01);

    if (coinsToAward <= 0) return;

    await this.prisma.$transaction(async (tx) => {
      // Cập nhật số xu của user
      await tx.user.update({
        where: { id: userId },
        data: { loyalty_coins: { increment: coinsToAward } },
      });

      // Lưu log
      await tx.coinTransaction.create({
        data: {
          user_id: userId,
          amount: coinsToAward,
          transaction_type: CoinTxType.EARN,
          reference_id: orderId,
        },
      });
    });

    this.logger.log(
      `Awarded ${coinsToAward} coins to user ${userId} for order ${orderId}`,
    );
  }

  async spendCoins(userId: string, coinsToSpend: number, orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { loyalty_coins: true },
      });

      if (!user || user.loyalty_coins < coinsToSpend) {
        throw new Error('Not enough coins');
      }

      await tx.user.update({
        where: { id: userId },
        data: { loyalty_coins: { decrement: coinsToSpend } },
      });

      await tx.coinTransaction.create({
        data: {
          user_id: userId,
          amount: -coinsToSpend,
          transaction_type: CoinTxType.SPEND,
          reference_id: orderId,
        },
      });
    });

    this.logger.log(
      `User ${userId} spent ${coinsToSpend} coins for order ${orderId}`,
    );
  }

  async getCoinBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyalty_coins: true },
    });
    return user?.loyalty_coins || 0;
  }
}
