import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

@Processor('order-expiration')
export class OrderExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderExpirationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;
    this.logger.log(`Processing expiration for order: ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sub_orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found`);
      return;
    }

    // Nếu đơn hàng đã được thanh toán hoặc xử lý, bỏ qua
    if (order.status !== 'PENDING_PAYMENT') {
      this.logger.log(
        `Order ${orderId} status is ${order.status}. No need to cancel.`,
      );
      return;
    }

    this.logger.log(`Cancelling order ${orderId} and returning stock.`);

    // 1. Return stock to Redis
    const client = this.redis.getClient();
    for (const subOrder of order.sub_orders) {
      for (const item of subOrder.items) {
        const key = `inventory:${item.variant_id}`;
        await client.incrby(key, item.quantity);
        this.logger.debug(
          `Returned ${item.quantity} to ${key} for order ${orderId}`,
        );
      }
    }

    // 2. Update DB status to CANCELED
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELED' },
      });

      await tx.subOrder.updateMany({
        where: { order_id: orderId },
        data: { status: 'CANCELED' },
      });

      // Update Payment status to FAILED/CANCELED
      await tx.payment.updateMany({
        where: { order_id: orderId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
    });

    this.logger.log(`Successfully canceled order ${orderId}`);
  }
}
