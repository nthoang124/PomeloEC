import { Test } from '@nestjs/testing';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { BulkPrintDto } from './dto/bulk-print.dto';

describe('FulfillmentController Edge Validation', () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      controllers: [FulfillmentController],
      providers: [
        {
          provide: FulfillmentService,
          useValue: {
            generateBulkOrderPdf: jest.fn().mockReturnValue({}),
          },
        },
      ],
    }).compile();
  });

  it('should throw validation error if orderIds length exceeds 50', () => {
    const pipe = new ZodValidationPipe();
    const largeArray = Array(51).fill('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    expect(() => {
      pipe.transform(
        { orderIds: largeArray },
        { type: 'body', metatype: BulkPrintDto },
      );
    }).toThrow();
  });

  it('should pass validation if orderIds length is 50', async () => {
    const pipe = new ZodValidationPipe();
    const validArray = Array(50).fill('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    const result = (await pipe.transform(
      { orderIds: validArray },
      { type: 'body', metatype: BulkPrintDto },
    )) as BulkPrintDto;

    expect(result.orderIds).toHaveLength(50);
  });
});
