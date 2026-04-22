import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const BulkPrintSchema = z.object({
  orderIds: z
    .array(z.string().uuid())
    .min(1)
    .max(50, 'Max 50 orders per print request'),
});

export class BulkPrintDto extends createZodDto(BulkPrintSchema) {
  orderIds: string[];
}
