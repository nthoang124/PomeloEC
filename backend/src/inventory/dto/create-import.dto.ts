import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImportDto {
  @ApiProperty({ description: 'ID của biến thể hàng hóa SKU' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ description: 'Số lượng hàng nhập thực tế vào tổng kho' })
  @IsNumber()
  @Min(1, { message: 'Số lượng nhập phải lớn hơn 0' })
  quantityChange: number;
}
