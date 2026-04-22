import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { OrderStatus, WalletTxType } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  // 1-click Refund (UC-09)
  async initiateRefund(orderId: string, reason: string) {
    this.logger.log(
      `Initiating refund for order ${orderId} - Reason: ${reason}`,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { sub_orders: true },
      });

      if (!order) throw new BadRequestException('Order not found');
      if (
        order.status !== 'DELIVERED' &&
        order.status !== 'PAID' &&
        order.status !== 'SHIPPED'
      ) {
        throw new BadRequestException('Cannot refund order at this status');
      }

      // Update Order Status to DISPUTED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DISPUTED },
      });

      // Update SubOrders
      await tx.subOrder.updateMany({
        where: { order_id: orderId },
        data: { status: OrderStatus.DISPUTED },
      });

      // Lock Escrow Wallet for each sub-order store
      for (const subOrder of order.sub_orders) {
        await tx.walletTransaction.create({
          data: {
            store_id: subOrder.store_id,
            amount: subOrder.total_amount,
            transaction_type: WalletTxType.ESCROW_DISPUTE,
            reference_order_id: order.id,
            description: `Dispute locked for refund - ${reason}`,
          },
        });
      }

      return { message: 'Refund initiated and escrow locked', orderId };
    });
  }

  // Cronjob: Auto complete delivered orders > 3 days (UC-14)
  @Cron('0 2 * * *') // Run at 2 AM every day
  async autoCompleteOrders() {
    this.logger.log('Running auto-complete for delivered orders > 3 days...');

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const ordersToComplete = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        updated_at: {
          lt: threeDaysAgo,
        },
      },
      include: { sub_orders: true },
    });

    for (const order of ordersToComplete) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Mark order as COMPLETED
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.COMPLETED },
          });

          await tx.subOrder.updateMany({
            where: { order_id: order.id },
            data: { status: OrderStatus.COMPLETED },
          });

          // Move funds from escrow to available balance for each store
          for (const subOrder of order.sub_orders) {
            await tx.store.update({
              where: { id: subOrder.store_id },
              data: {
                escrow_balance: { decrement: subOrder.total_amount },
                available_balance: { increment: subOrder.total_amount },
              },
            });

            await tx.walletTransaction.create({
              data: {
                store_id: subOrder.store_id,
                amount: subOrder.total_amount,
                transaction_type: WalletTxType.ESCROW_RELEASE,
                reference_order_id: order.id,
                description: 'Auto release funds (Order completed)',
              },
            });
          }
        });

        this.logger.log(`Order ${order.id} automatically completed.`);
      } catch (err) {
        this.logger.error(`Failed to auto-complete order ${order.id}`, err);
      }
    }
  }
}
