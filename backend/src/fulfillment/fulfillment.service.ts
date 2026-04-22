import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../shared/prisma/prisma.service';
import { Readable } from 'stream';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(private prisma: PrismaService) {}

  generateBulkOrderPdf(subOrderIds: string[]): Readable {
    this.logger.log(`Generating bulk PDF for ${subOrderIds.length} orders`);

    const doc = new PDFDocument({ margin: 50 });

    // Tạo mảng buffers để chứa stream
    // Nhưng vì chúng ta cần trả về 1 stream cho client, ta sẽ pipe nó thông qua PassThrough
    // hoặc trả về trực tiếp

    for (let i = 0; i < subOrderIds.length; i++) {
      if (i > 0) {
        doc.addPage();
      }

      // Mô phỏng việc vẽ hóa đơn
      doc.fontSize(20).text(`Phieu Giao Hang`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Ma Don Hang: ${subOrderIds[i]}`);
      doc.text(`Ngay In: ${new Date().toLocaleDateString('vi-VN')}`);
      doc.moveDown();
      doc.text(`Thong tin nguoi nhan: (Mocked Data)`);
      doc.text(`Dia chi: 123 Duong ABC, Quan XYZ, TP. HCM`);
      doc.moveDown();
      doc.rect(50, doc.y, 500, 100).stroke();
      doc.text('Ma Vach: |||| | ||| || |||', 60, doc.y + 20);
    }

    doc.end();

    // Return doc which is a readable stream
    return doc;
  }
}
