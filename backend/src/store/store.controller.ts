import { Controller, Post, Body } from '@nestjs/common';
import { StoreService, RegisterStoreDto } from './store.service';
import { Unprotected } from 'nest-keycloak-connect';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Unprotected()
  @Post('register')
  async register(@Body() dto: RegisterStoreDto) {
    return this.storeService.registerStore(dto);
  }
}
