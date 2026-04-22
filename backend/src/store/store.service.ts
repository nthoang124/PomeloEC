import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

export class RegisterStoreDto {
  email: string;
  name: string;
  identityCardUrl: string;
  businessLicenseUrl?: string;
  taxCode?: string;
}

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async registerStore(dto: RegisterStoreDto) {
    // Check if user exists by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if store already exists
    const existingStore = await this.prisma.store.findUnique({
      where: { owner_id: user.id },
    });

    if (existingStore) {
      throw new BadRequestException('User already has a store');
    }

    // Auto approve for testing
    const store = await this.prisma.store.create({
      data: {
        owner_id: user.id,
        name: dto.name,
        status: 'VERIFIED', // Auto-approved
        seller_profile: {
          create: {
            identity_card_url: dto.identityCardUrl,
            business_license_url: dto.businessLicenseUrl,
            tax_code: dto.taxCode,
          },
        },
      },
    });

    // Update user role to SELLER
    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: 'SELLER' },
    });

    return store;
  }
}
