import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'ID của Phân loại (SKU Variant)' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ description: 'ID của Cửa hàng để chia nhóm Order sau này' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'Số lượng mua' })
  @IsNumber()
  @Min(1)
  quantity: number;
}
