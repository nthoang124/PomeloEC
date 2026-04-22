import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RevenueReportSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'startDate must be before or equal to endDate',
    path: ['endDate'],
  });

export class RevenueReportDto extends createZodDto(RevenueReportSchema) {
  startDate: string;
  endDate: string;
}
