import { Controller, Post, Body, Res, UsePipes } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import type { Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { BulkPrintDto } from './dto/bulk-print.dto';

@Controller('fulfillment')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Post('bulk-print')
  @UsePipes(ZodValidationPipe)
  bulkPrint(@Body() body: BulkPrintDto, @Res() res: Response) {
    const { orderIds } = body;
    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({ message: 'No order IDs provided' });
    }

    const pdfStream = this.fulfillmentService.generateBulkOrderPdf(orderIds);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=bulk-orders.pdf',
    );

    pdfStream.pipe(res);
  }
}
