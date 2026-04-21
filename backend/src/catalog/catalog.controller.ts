import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { GenerateMatrixDto } from './dto/generate-matrix.dto';
import { Roles } from 'nest-keycloak-connect';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * API: POST /catalog/matrix/preview
   * Roles: SELLER (Only Seller can generate new SKU combinations)
   */
  @Post('matrix/preview')
  @Roles({ roles: ['SELLER'] })
  @UsePipes(new ValidationPipe({ transform: true }))
  previewSkusMatrix(@Body() generateMatrixDto: GenerateMatrixDto) {
    return this.catalogService.generateSkuMatrixPreview(generateMatrixDto);
  }
}
