import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { Prisma, SubOrder } from '@prisma/client';

const PLATFORM_FEE_PERCENTAGE = 0.035; // 3.5%

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLabel(subOrderId: string) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { store: true, items: true },
    });

    if (!subOrder) throw new BadRequestException('SubOrder not found');
    if (subOrder.status !== 'PAID' && subOrder.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        'Order cannot be shipped in current status',
      );
    }

    // Mock API call to GHTK
    const trackingCode = `GHTK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Update SubOrder status to SHIPPED
    await this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: {
        status: 'SHIPPED',
        tracking_number: trackingCode,
      },
    });

    // Check if all subOrders of the main order are shipped
    const order = await this.prisma.order.findUnique({
      where: { id: subOrder.order_id },
      include: { sub_orders: true },
    });

    const allShipped = order?.sub_orders.every(
      (so: SubOrder) => so.status === 'SHIPPED' || so.status === 'DELIVERED',
    );

    if (allShipped) {
      await this.prisma.order.update({
        where: { id: subOrder.order_id },
        data: { status: 'SHIPPED' },
      });
    }

    return { trackingCode, message: 'Label created successfully' };
  }

  async handleWebhook(trackingCode: string, status: string) {
    if (status !== 'DELIVERED') return { message: 'Ignored' };

    const subOrder = await this.prisma.subOrder.findFirst({
      where: { tracking_number: trackingCode },
      include: { store: true },
    });

    if (!subOrder || subOrder.status === 'DELIVERED') {
      return { message: 'Already processed or not found' };
    }

    // Use a transaction for the financial flow
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update SubOrder
      await tx.subOrder.update({
        where: { id: subOrder.id },
        data: { status: 'DELIVERED' },
      });

      // 2. Financial calculation
      const totalAmount = Number(subOrder.total_amount);
      const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
      const amountToSeller = totalAmount - platformFee;

      // 3. Update Store Wallets
      await tx.store.update({
        where: { id: subOrder.store_id },
        data: {
          escrow_balance: { decrement: totalAmount },
          available_balance: { increment: amountToSeller },
        },
      });

      // 4. Create Wallet Transactions Audit Log
      await tx.walletTransaction.createMany({
        data: [
          {
            store_id: subOrder.store_id,
            amount: totalAmount,
            transaction_type: 'ESCROW_RELEASE',
            reference_order_id: subOrder.id,
            description: `Giải phóng tiền chờ đối soát cho đơn ${subOrder.id}`,
          },
          {
            store_id: subOrder.store_id,
            amount: platformFee,
            transaction_type: 'PLATFORM_FEE',
            reference_order_id: subOrder.id,
            description: `Thu 3.5% phí nền tảng cho đơn ${subOrder.id}`,
          },
        ],
      });

      // 5. Update main order if all subOrders are DELIVERED
      const order = await tx.order.findUnique({
        where: { id: subOrder.order_id },
        include: { sub_orders: true },
      });

      const allDelivered = order?.sub_orders.every(
        (so: SubOrder) => so.status === 'DELIVERED',
      );

      if (allDelivered) {
        await tx.order.update({
          where: { id: subOrder.order_id },
          data: { status: 'DELIVERED' },
        });
      }
    });

    this.logger.log(
      `Order ${subOrder.id} marked as DELIVERED and funds settled.`,
    );
    return { message: 'Webhook processed, funds settled' };
  }
}
