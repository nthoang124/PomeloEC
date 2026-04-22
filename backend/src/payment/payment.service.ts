import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.tmnCode = this.configService.get<string>('VNP_TMN_CODE') as string;
    this.hashSecret = this.configService.get<string>(
      'VNP_HASH_SECRET',
    ) as string;
    this.vnpUrl = this.configService.get<string>(
      'VNP_URL',
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
    this.returnUrl = this.configService.get<string>(
      'VNP_RETURN_URL',
      'http://localhost:3000/payment/vnpay-return',
    );

    if (!this.tmnCode || !this.hashSecret) {
      throw new InternalServerErrorException(
        'VNPay configuration is missing (VNP_TMN_CODE or VNP_HASH_SECRET)',
      );
    }
  }

  private getCreateDate() {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  createVNPayUrl(orderId: string, amount: number, ipAddress: string): string {
    this.logger.log(
      `Generating VNPay URL for Order ${orderId} with amount ${amount}`,
    );

    const createDate = this.getCreateDate();

    // VNPay amount is multiplied by 100
    const vnpAmount = amount * 100;

    let vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: createDate,
    };

    vnpParams = this.sortObject(vnpParams);

    const signData = querystring.stringify(vnpParams, undefined, undefined, {
      encodeURIComponent: this.encodeURI,
    });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;
    const paymentUrl =
      this.vnpUrl +
      '?' +
      querystring.stringify(vnpParams, undefined, undefined, {
        encodeURIComponent: this.encodeURI,
      });

    return paymentUrl;
  }

  async processIpnWebhook(query: Record<string, string>) {
    let vnpParams = { ...query };
    const secureHash = vnpParams['vnp_SecureHash'];

    delete vnpParams['vnp_SecureHash'];
    delete vnpParams['vnp_SecureHashType'];

    vnpParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(vnpParams, undefined, undefined, {
      encodeURIComponent: this.encodeURI,
    });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const orderId = vnpParams['vnp_TxnRef'];
      const responseCode = vnpParams['vnp_ResponseCode'];

      if (responseCode === '00') {
        // Success
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { order_id: orderId },
            data: {
              status: 'SUCCESS',
              txn_ref: vnpParams['vnp_TransactionNo'],
            },
          });
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
          });
          await tx.subOrder.updateMany({
            where: { order_id: orderId },
            data: { status: 'PAID' },
          });
        });
        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        // Failed
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { order_id: orderId },
            data: { status: 'FAILED' },
          });
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'CANCELED' },
          });
        });
        // Note: Realistically, we should also restore inventory here via Kafka event or directly
        return { RspCode: '00', Message: 'Confirm Success' };
      }
    } else {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }
  }

  private sortObject(obj: Record<string, string | number>) {
    const sorted: Record<string, string> = {};
    const str = [];
    let key;
    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      const decodedKey = decodeURIComponent(str[key]);
      sorted[str[key]] = encodeURIComponent(String(obj[decodedKey])).replace(
        /%20/g,
        '+',
      );
    }
    return sorted;
  }

  private encodeURI = (str: string | number | boolean) => {
    return encodeURIComponent(str).replace(/%20/g, '+');
  };
}
