import {
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttributeValueDto {
  @IsString()
  value: string;
}

export class GenerateMatrixAttributeDto {
  @IsString()
  name: string; // e.g. "Color", "Size"

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  values: AttributeValueDto[];
}

export class GenerateMatrixDto {
  @IsString()
  baseSku: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GenerateMatrixAttributeDto)
  attributes: GenerateMatrixAttributeDto[];
}
