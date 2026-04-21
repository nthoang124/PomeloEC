import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { GenerateMatrixDto } from './dto/generate-matrix.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Thuật toán sinh tổ hợp chập (Cartesian Product) cho nhiều mảng Attribute Options
   * Ví dụ: Color [Red, Blue] x Size [S, M]
   * Trả về: [[Red, S], [Red, M], [Blue, S], [Blue, M]]
   */
  private cartesianProduct(arrays: string[][]): string[][] {
    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap((combo) => curr.map((val) => [...combo, val])),
      [[]],
    );
  }

  /**
   * Sinh mảng Variants (SKUs) dựa trên cấu hình Matrix động.
   * Dùng trả về Preview cho Seller trước khi Insert vào Db.
   */
  generateSkuMatrixPreview(dto: GenerateMatrixDto) {
    if (!dto.attributes || dto.attributes.length === 0) {
      throw new BadRequestException(
        'Bắt buộc phải có ít nhất 1 tham số (Color/Size...)',
      );
    }

    // Rút trích mảng các chuỗi giá trị
    const attributeValuesArray = dto.attributes.map((attr) =>
      attr.values.map((v) => v.value),
    );

    // Tính toán ma trận
    const combinations = this.cartesianProduct(attributeValuesArray);

    return combinations.map((combination) => {
      // Nối sku gốc với các attribute viết liền bằng dấu gạch ngang (VD: SHIRT-RED-L)
      const skuSuffix = combination
        .map((val) => val.toUpperCase().replace(/\s+/g, ''))
        .join('-');

      const sku = `${dto.baseSku.toUpperCase()}-${skuSuffix}`;

      // Mapping rõ ràng cho Frontend render bảng
      const parsedAttributes = combination.map((val, index) => ({
        attributeName: dto.attributes[index].name,
        value: val,
      }));

      return {
        sku,
        attributes: parsedAttributes,
        recommendedPrice: 0, // Placeholder cho Seller tự điền
        stockQuantity: 0, // Placeholder
      };
    });
  }
}
