import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CheckoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  storeId: z.string().uuid(), // Important for sub-orders splitting
});

const CheckoutRequestSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  paymentMethod: z.enum(['COD', 'VNPAY', 'MOMO']).default('VNPAY'),
  voucherCode: z.string().optional(),
  usePomeloCoins: z.number().int().nonnegative().optional(),
});

export class CheckoutRequestDto extends createZodDto(CheckoutRequestSchema) {
  items: { variantId: string; quantity: number; storeId: string }[];
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO';
  voucherCode?: string;
  usePomeloCoins?: number;
}
