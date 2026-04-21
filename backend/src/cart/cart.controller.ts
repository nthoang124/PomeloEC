import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';

@ApiTags('Shopping Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @Roles({ roles: ['BUYER'] })
  async addItem(
    @Body() addCartItemDto: AddCartItemDto,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const userId = req.user?.sub ?? '';
    return this.cartService.addItem(userId, addCartItemDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách Giỏ hàng (Nhóm theo Shop)' })
  @Roles({ roles: ['BUYER'] })
  async getCart(@Req() req: Request & { user?: { sub: string } }) {
    const userId = req.user?.sub ?? '';
    return this.cartService.getCart(userId);
  }

  @Delete('items/:storeId/:variantId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa 1 mặt hàng khỏi Giỏ' })
  @Roles({ roles: ['BUYER'] })
  async removeItem(
    @Param('storeId') storeId: string,
    @Param('variantId') variantId: string,
    @Req() req: Request & { user?: { sub: string } },
  ) {
    const userId = req.user?.sub ?? '';
    return this.cartService.removeItem(userId, storeId, variantId);
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xóa toàn bộ Giỏ hàng (dùng khi Checkout thành công)',
  })
  @Roles({ roles: ['BUYER'] })
  async clearCart(@Req() req: Request & { user?: { sub: string } }) {
    const userId = req.user?.sub ?? '';
    return this.cartService.clearCart(userId);
  }
}
