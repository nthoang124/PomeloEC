import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { CreateImportDto } from './dto/create-import.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';

@ApiTags('Inventory Management')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('import')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seller nhập hàng hóa cho SKU' })
  @Roles({ roles: ['SELLER'] })
  async importGoods(
    @Body() createImportDto: CreateImportDto,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    // req.user được Inject từ Keycloak JWT parsing qua middleware
    const userId = req.user?.sub ?? '';
    return this.inventoryService.importGoods(createImportDto, userId);
  }
}
